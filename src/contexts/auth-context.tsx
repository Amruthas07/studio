
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
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  updatePassword,
} from 'firebase/auth';
import { useFirestore, useAuth as useFirebaseAuth, useUser } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { Student, Teacher } from '@/lib/types';

type Role = 'admin' | 'student' | 'teacher';

export interface AuthUser extends Omit<Student, 'department' | 'semester' | 'uid'> {
  uid: string;
  role: Role;
  department: Student['department'] | 'all';
  semester?: number;
  position?: Teacher['position'];
  subjects?: Teacher['subjects'];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const ADMIN_EMAIL = "apdd46@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const { user: firebaseUser, isUserLoading } = useUser();

  const logout = useCallback(async () => {
    await signOut(auth);
    setAuthUser(null);
    router.push('/');
  }, [auth, router]);

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
      const userEmail = user.email?.toLowerCase();
      
      try {
        if (userEmail === ADMIN_EMAIL.toLowerCase()) {
           profile = {
              uid: user.uid,
              name: user.displayName || 'Administrator',
              email: user.email!,
              role: 'admin',
              department: 'all',
              registerNumber: user.uid,
              fatherName: 'N/A',
              motherName: 'N/A',
              contact: 'N/A',
              createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
              dateOfBirth: new Date(),
           };
        } else {
            // Check for teacher profile first
            const teacherDocRef = doc(firestore, 'teachers', userEmail!);
            const teacherDocSnap = await getDoc(teacherDocRef);
            
            if (teacherDocSnap.exists()) {
                const foundTeacher = teacherDocSnap.data() as Teacher;
                profile = {
                    uid: user.uid,
                    name: foundTeacher.name,
                    email: foundTeacher.email,
                    role: 'teacher',
                    department: foundTeacher.department,
                    position: foundTeacher.position,
                    subjects: foundTeacher.subjects,
                    registerNumber: foundTeacher.teacherId || foundTeacher.email,
                    fatherName: 'N/A',
                    motherName: 'N/A',
                    contact: 'N/A',
                    createdAt: foundTeacher.createdAt instanceof Date ? foundTeacher.createdAt : (foundTeacher.createdAt as any).toDate(),
                    dateOfBirth: new Date(),
                };
            } else {
                // Check for student profile
                const studentsRef = collection(firestore, 'students');
                const q = query(studentsRef, where('uid', '==', user.uid), limit(1));
                const studentQuerySnap = await getDocs(q);

                if (!studentQuerySnap.empty) {
                    const studentDoc = studentQuerySnap.docs[0];
                    const foundStudent = studentDoc.data();
                    profile = {
                        name: foundStudent.name,
                        email: foundStudent.email,
                        role: 'student',
                        department: foundStudent.department,
                        semester: foundStudent.semester,
                        registerNumber: foundStudent.registerNumber,
                        fatherName: foundStudent.fatherName,
                        motherName: foundStudent.motherName,
                        contact: foundStudent.contact,
                        uid: foundStudent.uid,
                        createdAt: foundStudent.createdAt?.toDate ? foundStudent.createdAt.toDate() : new Date(foundStudent.createdAt),
                        dateOfBirth: foundStudent.dateOfBirth?.toDate ? foundStudent.dateOfBirth.toDate() : new Date(foundStudent.dateOfBirth),
                        updatedAt: foundStudent.updatedAt?.toDate ? foundStudent.updatedAt.toDate() : undefined,
                    } as AuthUser;
                }
            }
        }

        if (profile) {
          setAuthUser(profile);
          const targetPath = profile.role === 'admin' ? '/admin' : (profile.role === 'student' ? '/student' : '/teacher');
          router.push(targetPath);
        } else {
            await signOut(auth); 
        }

      } catch (error: any) {
          if (error.code === 'permission-denied') {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: `Profile lookup for ${userEmail}`, 
                  operation: 'get'
              }));
          }
          await signOut(auth);
          profile = null;
      } finally {
        setAuthUser(profile);
        setLoading(false);
      }
    };

    fetchUserProfile(firebaseUser);
  }, [firebaseUser, isUserLoading, firestore, auth, router]);

  const login = useCallback(async (identifier: string, pass: string) => {
    let emailToLogin = identifier.toLowerCase();
    
    if (!identifier.includes('@')) {
        if (!firestore) throw new Error("Database not available.");
        const studentQuery = query(collection(firestore, 'students'), where('registerNumber', '==', identifier), limit(1));
        const studentSnap = await getDocs(studentQuery);
        if (!studentSnap.empty) {
            emailToLogin = studentSnap.docs[0].data().email.toLowerCase();
        }
    }
    
    try {
      await signInWithEmailAndPassword(auth, emailToLogin, pass);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' && emailToLogin.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          await createUserWithEmailAndPassword(auth, emailToLogin, "apdd46@");
        } catch (creationError: any) {
          throw new Error('Failed to create admin.');
        }
      } else {
        throw new Error('Invalid credentials.');
      }
    }
  }, [auth, firestore]);

  const changePassword = useCallback(async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user signed in.' };
    try {
        await updatePassword(user, newPass);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user: authUser, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
