
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useFirestore, useAuth as useFirebaseAuth, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import type { Student, Teacher } from '@/lib/types';

type Role = 'admin' | 'student' | 'teacher';

export interface AuthUser extends Omit<Student, 'department'> {
  role: Role;
  department: Student['department'] | 'all';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string, role: Role, department?: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const { user: firebaseUser, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading || !firestore) {
      setLoading(true);
      return;
    }

    if (!firebaseUser) {
      setAuthUser(null);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async (user: FirebaseUser) => {
      setLoading(true);
      let profile: AuthUser | null = null;
      
      await user.getIdToken(true);

      try {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const adminDocSnap = await getDoc(adminRoleRef);

        if (adminDocSnap.exists()) {
             profile = {
                name: user.displayName || 'Administrator',
                email: user.email!,
                role: 'admin',
                department: 'all',
                registerNumber: user.uid,
                fatherName: 'N/A',
                motherName: 'N/A',
                profilePhotoUrl: user.photoURL || 'https://picsum.photos/seed/admin/100/100',
                contact: 'N/A',
                createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
                dateOfBirth: new Date(),
             };
        } else {
            const teacherDocRef = doc(firestore, 'teachers', user.email!);
            const teacherDocSnap = await getDoc(teacherDocRef);
            if (teacherDocSnap.exists()) {
                const foundTeacher = teacherDocSnap.data() as Teacher;
                profile = {
                    name: foundTeacher.name,
                    email: foundTeacher.email,
                    role: 'teacher',
                    department: foundTeacher.department,
                    registerNumber: foundTeacher.teacherId || foundTeacher.email,
                    fatherName: 'N/A',
                    motherName: 'N/A',
                    profilePhotoUrl: foundTeacher.profilePhotoUrl || '',
                    contact: 'N/A',
                    createdAt: foundTeacher.createdAt instanceof Date ? foundTeacher.createdAt : foundTeacher.createdAt.toDate(),
                    dateOfBirth: new Date(),
                };
            } else {
                const studentsRef = collection(firestore, 'students');
                const q = query(studentsRef, where('email', '==', user.email!), limit(1));
                const studentQuerySnap = await getDocs(q);

                if (!studentQuerySnap.empty) {
                    const studentDoc = studentQuerySnap.docs[0];
                    const foundStudent = studentDoc.data() as any;
                     profile = { 
                        ...foundStudent,
                        createdAt: foundStudent.createdAt.toDate(),
                        dateOfBirth: foundStudent.dateOfBirth.toDate(), 
                        role: 'student',
                    };
                }
            }
        }

        if (!profile) {
            console.warn(`User ${user.email} is authenticated but has no role in the application.`);
            await signOut(auth); 
        }

      } catch (error: any) {
           if (error.code === 'permission-denied') {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: `roles_admin/${user.uid}`, 
                  operation: 'get'
              }));
          }
          await signOut(auth);
          profile = null;
      }
      
      setAuthUser(profile);
      setLoading(false);
    };

    fetchUserProfile(firebaseUser);
  }, [firebaseUser, isUserLoading, firestore, auth]);


  const login = useCallback(async (email: string, pass: string, role: Role) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      await user.getIdToken(true);

      if (!user.email) {
        await signOut(auth);
        throw new Error("Authentication failed: User has no email.");
      }
      
      let actualRole: Role | null = null;

      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      const adminDocSnap = await getDoc(adminRoleRef);
      if (adminDocSnap.exists()) {
          actualRole = 'admin';
      } else {
          const teacherDocRef = doc(firestore, 'teachers', user.email);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
              actualRole = 'teacher';
          } else {
              const studentsRef = collection(firestore, 'students');
              const q = query(studentsRef, where('email', '==', user.email), limit(1));
              const studentQuerySnap = await getDocs(q);
              if (!studentQuerySnap.empty) {
                  actualRole = 'student';
              }
          }
      }

      if (!actualRole) {
        await signOut(auth);
        throw new Error("Your account was not found in the system. Please contact an administrator.");
      }

      if (actualRole !== role) {
        await signOut(auth);
        throw new Error(`Account is for a ${actualRole}. Please use the ${actualRole} login page.`);
      }
      
      const targetPath = role === 'admin' ? '/admin' : (role === 'student' ? '/student' : '/teacher');
      router.push(targetPath);

    } catch (error: any) {
      if (
        role === 'admin' &&
        email.toLowerCase() === 'apdd46@gmail.com' &&
        error.code === 'auth/user-not-found'
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          const user = userCredential.user;
          
          await user.getIdToken(true);

          const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
          await setDoc(adminRoleRef, { role: 'admin', createdAt: serverTimestamp() });
          
          router.push('/admin');
          return;

        } catch (creationError: any) {
          throw new Error(`Admin account creation failed: ${creationError.message}`);
        }
      }
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          throw new Error('Invalid email or password.');
      }
      throw error;
    }
  }, [auth, firestore, router]);


  const logout = useCallback(async () => {
    await signOut(auth);
    setAuthUser(null);
    router.push('/');
  }, [auth, router]);

  return (
    <AuthContext.Provider value={{ user: authUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
