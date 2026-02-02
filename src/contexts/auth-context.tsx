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
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
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

const ADMIN_EMAIL = "apdd46@gmail.com";
const ADMIN_PASSWORD = "sixth@sem";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const { user: firebaseUser, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
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
      
      try {
        const teacherDocRef = doc(firestore, 'teachers', user.email!);
        let teacherDocSnap;
        try {
            teacherDocSnap = await getDoc(teacherDocRef);
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'get'}));
            }
            throw error;
        }

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
            let studentQuerySnap;
            try {
                studentQuerySnap = await getDocs(q);
            } catch (error: any) {
                if (error.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'students', operation: 'list'}));
                }
                throw error;
            }

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
      } catch (error) {
          await signOut(auth);
          profile = null;
      }
      
      setAuthUser(profile);
      setLoading(false);
    };

    // The admin user is not in Firebase Auth, so we don't fetch a profile for it.
    if (firebaseUser.email?.toLowerCase() !== ADMIN_EMAIL) {
        fetchUserProfile(firebaseUser);
    } else {
        // If a real Firebase user has the admin email, sign them out
        // to prevent conflicts with the mock admin user.
        signOut(auth);
        setAuthUser(null);
        setLoading(false);
    }
  }, [firebaseUser, isUserLoading, firestore, auth]);


  const login = useCallback(async (email: string, pass: string, role: Role) => {
    try {
      // Special case for prototype admin login
      if (email.toLowerCase() === ADMIN_EMAIL) {
        if (role !== 'admin') {
          throw new Error(`Account is for an admin. Please use the admin login page.`);
        }
        if (pass === ADMIN_PASSWORD) {
          const adminProfile: AuthUser = {
            name: 'Smart Institute Admin',
            email: ADMIN_EMAIL,
            role: 'admin',
            department: 'all',
            registerNumber: 'ADMIN_001',
            fatherName: 'N/A',
            motherName: 'N/A',
            profilePhotoUrl: 'https://picsum.photos/seed/admin/100/100',
            contact: 'N/A',
            createdAt: new Date(),
            dateOfBirth: new Date(),
          };
          setAuthUser(adminProfile);
          router.push('/admin');
          return;
        } else {
          throw new Error('Invalid email or password.');
        }
      }

      // Regular Firebase Auth for students and teachers
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      if (!user.email) {
        await signOut(auth);
        throw new Error("Authentication failed: User has no email.");
      }

      let actualRole: Role | null = null;
        const teacherDocRef = doc(firestore, 'teachers', user.email);
        let teacherDocSnap;
        try {
            teacherDocSnap = await getDoc(teacherDocRef);
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'get' }));
            }
            throw error;
        }

        if (teacherDocSnap.exists()) {
          actualRole = 'teacher';
        } else {
          const studentsRef = collection(firestore, 'students');
          const q = query(studentsRef, where('email', '==', user.email), limit(1));
          let studentQuerySnap;
          try {
              studentQuerySnap = await getDocs(q);
          } catch(error: any) {
              if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'students', operation: 'list' }));
              }
              throw error;
          }
          
          if (!studentQuerySnap.empty) {
            actualRole = 'student';
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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          throw new Error('Invalid email or password.');
      }
      throw error;
    }
  }, [auth, firestore, router]);


  const logout = useCallback(async () => {
    // Special handling for mock admin user
    if (authUser?.role === 'admin') {
        setAuthUser(null);
        router.push('/');
        return;
    }
    // For real Firebase users
    await signOut(auth);
    setAuthUser(null);
    router.push('/');
  }, [auth, router, authUser]);

  return (
    <AuthContext.Provider value={{ user: authUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
