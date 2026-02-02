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
        
        if (authUser) {
            setUser(authUser);
            localStorage.setItem('smartattend_user_role', authUser.role);
        } else {
            // If Firebase has a user but we don't have a record, something is wrong. Log them out.
            console.warn(`User ${firebaseUser.email} authenticated but not found in database. Logging out.`);
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('smartattend_user_role');
        }
      } else {
        setUser(null);
        localStorage.removeItem('smartattend_user_role');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const login = useCallback(async (email: string, pass: string, role: Role, department?: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (!firebaseUser.email) {
        await signOut(auth);
        throw new Error("Authentication failed: User has no email.");
      }

      let actualRole: Role | null = null;
      if (firebaseUser.email.toLowerCase() === ADMIN_EMAIL) {
        actualRole = 'admin';
      } else {
        const teacherDocRef = doc(firestore, 'teachers', firebaseUser.email);
        const teacherDocSnap = await getDoc(teacherDocRef);
        if (teacherDocSnap.exists()) {
          actualRole = 'teacher';
        } else {
          const studentsRef = collection(firestore, 'students');
          const q = query(studentsRef, where('email', '==', firebaseUser.email), limit(1));
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
      // onAuthStateChanged will handle setting the user and setLoading(false)
    } catch (error: any) {
      setLoading(false); // Ensure loading is stopped on any error
      // Re-throw the error so the login form can display it
      throw error;
    }
  }, [auth, firestore, router]);


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
