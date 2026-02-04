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
} from 'firebase/auth';
import { useFirestore, useAuth as useFirebaseAuth, useUser } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { Student, Teacher } from '@/lib/types';

type Role = 'admin' | 'student' | 'teacher';

export interface AuthUser extends Omit<Student, 'department'> {
  role: Role;
  department: Student['department'] | 'all';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// The administrator email. This is the single source of truth for the admin role.
const ADMIN_EMAIL = "apdd46@gmail.com";


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
        // Use email as the single source of truth for identifying the admin role.
        if (user.email === ADMIN_EMAIL) {
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
            // Check if the user is a teacher
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
                // Check if the user is a student by their UID
                const studentsRef = collection(firestore, 'students');
                const q = query(studentsRef, where('uid', '==', user.uid), limit(1));
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

        if (profile) {
          setAuthUser(profile);
          // Redirect after setting user
          const targetPath = profile.role === 'admin' ? '/admin' : (profile.role === 'student' ? '/student' : '/teacher');
          router.push(targetPath);
        } else {
            console.warn(`User ${user.email} is authenticated but has no profile in the application.`);
            await signOut(auth); 
        }

      } catch (error: any) {
           if (error.code === 'permission-denied') {
              // This error is now less likely for admin, but retained for other roles.
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: `Profile lookup for ${user.email}`, 
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


  const login = useCallback(async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // On successful sign-in, the onAuthStateChanged listener in useEffect will
      // fetch the profile and trigger the appropriate redirect.
    } catch (error: any) {
      // If the user is not found and it's the admin email, attempt to create the admin user.
      if (error.code === 'auth/user-not-found' && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          await createUserWithEmailAndPassword(auth, email, "apdd46@");
          // On successful creation, the onAuthStateChanged listener will fire,
          // fetch the profile, and handle the redirect.
        } catch (creationError: any) {
          console.error("Admin account creation failed:", creationError);
          if (creationError.code === 'auth/weak-password') {
             throw new Error('The administrator password is too weak. It must be at least 6 characters.');
          }
          throw new Error('Failed to create administrator account.');
        }
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // For existing users with wrong password.
        throw new Error('Invalid email or password.');
      } else {
        // Handle other login errors.
        console.error("Login error:", error.code, error.message);
        throw new Error('An unexpected error occurred during login.');
      }
    }
  }, [auth]);


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
