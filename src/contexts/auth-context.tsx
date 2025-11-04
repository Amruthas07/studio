
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

type Role = 'admin' | 'student';

type Department = 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';

interface AuthUser extends Omit<Student, 'department'> {
  role: Role;
  department: Department | 'all';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string, department?: string) => Promise<void>;
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
      const storedUser = localStorage.getItem('faceattend_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('faceattend_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string, department?: string) => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 500));

    const isAttemptingAdminLogin = email.toLowerCase() === 'jsspn324@gmail.com';

    if (isAttemptingAdminLogin) {
      if (pass === '571301') {
        const adminUser: AuthUser = {
          name: 'JSS Admin',
          email: 'jsspn324@gmail.com',
          role: 'admin',
          department: (department as Department) || 'cs',
          registerNumber: 'ADMIN_001',
          fatherName: 'N/A',
          motherName: 'N/A',
          photoURL:
            'https://jssonline.org/wp-content/uploads/2023/11/JSS_Polytechnic-Nanjangud.jpg',
          contact: 'N/A',
          createdAt: new Date(),
          dateOfBirth: new Date(),
        };
        setUser(adminUser);
        localStorage.setItem('faceattend_user', JSON.stringify(adminUser));
        setLoading(false);
        router.push('/admin');
        return;
      } else {
        setLoading(false);
        throw new Error('Invalid admin credentials.');
      }
    }
    
    if (!firestore) {
        setLoading(false);
        throw new Error("Database service is not ready.");
    }

    // Student Login
    const studentsRef = collection(firestore, 'students');
    const q = query(
      studentsRef,
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        setLoading(false);
        throw new Error("No student found with this email address.");
    }
    
    const studentDoc = querySnapshot.docs[0];
    const foundStudent = studentDoc.data() as Student;

    if (foundStudent && pass === foundStudent.registerNumber) {
      const studentUser: AuthUser = { 
          ...foundStudent, 
          role: 'student',
          // Firestore timestamps need to be converted to serializable format for localStorage
          createdAt: foundStudent.createdAt.toString(),
          dateOfBirth: foundStudent.dateOfBirth.toString(),
      };
      setUser(studentUser);
      localStorage.setItem('faceattend_user', JSON.stringify(studentUser));
      setLoading(false);
      router.push('/student');
    } else {
      setLoading(false);
      throw new Error('Invalid email or password.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('faceattend_user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
