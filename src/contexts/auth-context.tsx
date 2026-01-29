
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { useFirestore } from '@/hooks/use-firebase';
import type { Student } from '@/lib/types';

type Role = 'admin' | 'student' | 'teacher';

type Department = 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';

interface AuthUser extends Omit<Student, 'department'> {
  role: Role;
  department: Department | 'all';
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('smartattend_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('smartattend_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string, role: Role, department?: string) => {
    setLoading(true);
    
    try {
      if (role === 'admin') {
          if (email.toLowerCase() !== 'jsspn324@gmail.com') {
              throw new Error("Invalid admin email address.");
          }
          if (pass === '571301') {
            const adminUser: AuthUser = {
              name: 'JSS Admin',
              email: 'jsspn324@gmail.com',
              role: 'admin',
              department: (department as Department) || 'cs',
              registerNumber: 'ADMIN_001',
              fatherName: 'N/A',
              motherName: 'N/A',
              profilePhotoUrl:
                'https://picsum.photos/seed/jsspoly/100/100',
              contact: 'N/A',
              createdAt: new Date(),
              dateOfBirth: new Date(),
            };
            setUser(adminUser);
            localStorage.setItem('smartattend_user', JSON.stringify(adminUser));
            router.push('/admin');
            return;
          } else {
            throw new Error('Invalid admin credentials.');
          }
      } else if (role === 'student') {
          if (!firestore) {
              throw new Error("Database service is not ready.");
          }
    
          const studentsRef = collection(firestore, 'students');
          const q = query(
            studentsRef,
            where('email', '==', email.toLowerCase()),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
    
          if (querySnapshot.empty) {
              throw new Error("No student found with this email address.");
          }
          
          const studentDoc = querySnapshot.docs[0];
          const foundStudent = studentDoc.data();
    
          if (foundStudent && pass === foundStudent.registerNumber) {
            const studentUser: AuthUser = { 
                ...(foundStudent as Student), 
                role: 'student',
                createdAt: foundStudent.createdAt?.toDate ? foundStudent.createdAt.toDate() : new Date(foundStudent.createdAt),
                dateOfBirth: foundStudent.dateOfBirth?.toDate ? foundStudent.dateOfBirth.toDate() : new Date(foundStudent.dateOfBirth),
            };
            setUser(studentUser);
            localStorage.setItem('smartattend_user', JSON.stringify(studentUser));
            router.push('/student');
          } else {
            throw new Error('Invalid email or password.');
          }
      } else if (role === 'teacher') {
          if (!firestore) {
              throw new Error("Database service is not ready.");
          }
          const teachersRef = collection(firestore, 'teachers');
          const q = query(teachersRef, where('email', '==', email.toLowerCase()), limit(1));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
              throw new Error("No teacher found with this email address.");
          }

          const teacherDoc = querySnapshot.docs[0];
          const foundTeacher = teacherDoc.data();

          // NOTE: In a real app, passwords should be hashed. This is for prototype purposes.
          if (foundTeacher && pass === foundTeacher.password) {
                const teacherUser: AuthUser = {
                  name: foundTeacher.name,
                  email: foundTeacher.email,
                  role: 'teacher',
                  department: foundTeacher.department,
                  // Filling in dummy data to satisfy the `AuthUser` type which extends `Student`
                  registerNumber: foundTeacher.teacherId || foundTeacher.email,
                  fatherName: 'N/A',
                  motherName: 'N/A',
                  profilePhotoUrl: foundTeacher.profilePhotoUrl || 'https://picsum.photos/seed/teacher/100/100',
                  contact: 'N/A',
                  createdAt: foundTeacher.createdAt?.toDate ? foundTeacher.createdAt.toDate() : new Date(foundTeacher.createdAt),
                  dateOfBirth: new Date(), // dummy date
                };
              setUser(teacherUser);
              localStorage.setItem('smartattend_user', JSON.stringify(teacherUser));
              router.push('/teacher');
          } else {
              throw new Error('Invalid email or password.');
          }
      }
    } catch(error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartattend_user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
