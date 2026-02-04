
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
  reauthenticateWithCredential,
  EmailAuthProvider,
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

// The administrator email. This is the single source of truth for the admin role.
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
      
      await user.getIdToken(true);

      try {
        // Use email as the single source of truth for identifying the admin role.
        if (user.email === ADMIN_EMAIL) {
           profile = {
              uid: user.uid,
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
                        profilePhotoUrl: foundStudent.profilePhotoUrl || '',
                        contact: foundStudent.contact,
                        photoHash: foundStudent.photoHash,
                        uid: foundStudent.uid,
                        createdAt: foundStudent.createdAt?.toDate ? foundStudent.createdAt.toDate() : new Date(),
                        dateOfBirth: foundStudent.dateOfBirth?.toDate ? foundStudent.dateOfBirth.toDate() : new Date(),
                        updatedAt: foundStudent.updatedAt?.toDate ? foundStudent.updatedAt.toDate() : undefined,
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


  const login = useCallback(async (identifier: string, pass: string) => {
    let emailToLogin = identifier;

    // If identifier doesn't look like an email, assume it's a register number.
    if (!identifier.includes('@') && !identifier.includes('.')) {
        if (!firestore) throw new Error("Database not available.");
        
        // Try finding a student by register number to get their email
        const studentQuery = query(collection(firestore, 'students'), where('registerNumber', '==', identifier), limit(1));
        const studentSnap = await getDocs(studentQuery);

        if (!studentSnap.empty) {
            emailToLogin = studentSnap.docs[0].data().email;
        }
        // If not found, let signInWithEmailAndPassword handle the failure.
    }
    
    try {
      await signInWithEmailAndPassword(auth, emailToLogin, pass);
      // On successful sign-in, the onAuthStateChanged listener in useEffect will
      // fetch the profile and trigger the appropriate redirect.
    } catch (error: any) {
      // If the user is not found and it's the admin email, attempt to create the admin user.
      if (error.code === 'auth/user-not-found' && emailToLogin.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          await createUserWithEmailAndPassword(auth, emailToLogin, "apdd46@");
          // On successful creation, the onAuthStateChanged listener will fire,
          // fetch the profile, and handle the redirect.
        } catch (creationError: any) {
          console.error("Admin account creation failed:", creationError);
          if (creationError.code === 'auth/weak-password') {
             throw new Error('The administrator password is too weak. It must be at least 6 characters.');
          }
          throw new Error('Failed to create administrator account.');
        }
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        // For existing users with wrong password or if user does not exist.
        throw new Error('Invalid credentials provided.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid format for email or register number.');
      } else {
        // Handle other login errors.
        console.error("Login error:", error.code, error.message);
        throw new Error('An unexpected error occurred during login.');
      }
    }
  }, [auth, firestore]);

  const changePassword = useCallback(async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'No user is currently signed in.' };
    }

    try {
        await updatePassword(user, newPass);
        return { success: true };
    } catch (error: any) {
        console.error("Password change error:", error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'This action is sensitive and requires recent authentication. Please log out and log back in to change your password.';
            logout();
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'The new password is too weak. It must be at least 6 characters long.';
        }
        return { success: false, error: errorMessage };
    }
  }, [auth, logout]);

  return (
    <AuthContext.Provider value={{ user: authUser, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

    