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
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { useFirestore, useAuth as useFirebaseAuth } from '@/hooks/use-firebase';
import type { Student, Teacher } from '@/lib/types';

type Role = 'admin' | 'student' | 'teacher';

interface AuthUser extends Omit<Student, 'department'> {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser && firebaseUser.email) {
        let authUser: AuthUser | null = null;
        
        // Admin user check
        if (firebaseUser.email.toLowerCase() === ADMIN_EMAIL) {
          authUser = {
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
        } else {
          // Check for teacher
          const teacherDocRef = doc(firestore, 'teachers', firebaseUser.email);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
            const foundTeacher = teacherDocSnap.data() as Teacher;
            authUser = {
              name: foundTeacher.name,
              email: foundTeacher.email,
              role: 'teacher',
              department: foundTeacher.department,
              registerNumber: foundTeacher.teacherId || foundTeacher.email,
              fatherName: 'N/A',
              motherName: 'N/A',
              profilePhotoUrl: foundTeacher.profilePhotoUrl || '',
              contact: 'N/A',
              createdAt: foundTeacher.createdAt,
              dateOfBirth: new Date(), // dummy date
            };
          } else {
            // Check for student
            const studentsRef = collection(firestore, 'students');
            const q = query(studentsRef, where('email', '==', firebaseUser.email), limit(1));
            const studentQuerySnap = await getDocs(q);
            if (!studentQuerySnap.empty) {
              const studentDoc = studentQuerySnap.docs[0];
              const foundStudent = studentDoc.data() as Student;
               authUser = { 
                  ...foundStudent, 
                  role: 'student',
              };
            }
          }
        }
        setUser(authUser);
        if (authUser) {
            localStorage.setItem('smartattend_user_role', authUser.role);
        }
      } else {
        setUser(null);
        localStorage.removeItem('smartattend_user_role');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const login = useCallback(async (email: string, pass: string, role: Role) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user and redirecting
      const targetPath = role === 'admin' ? '/admin' : (role === 'student' ? '/student' : '/teacher');
      router.push(targetPath);
    } catch(error) {
      // Let the form handle the error toast
      throw error;
    } finally {
      setLoading(false);
    }
  }, [auth, router]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('smartattend_user_role');
    router.push('/');
  }, [auth, router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
