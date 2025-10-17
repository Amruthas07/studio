"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mockStudents } from '@/lib/mock-data';
import type { Student } from '@/lib/types';

type Role = 'admin' | 'student';

interface AuthUser extends Omit<Student, 'department'> {
    role: Role;
    department: Student['department'] | 'all';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string, department?: Student['department']) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('faceattend_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('faceattend_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string, department?: Student['department']) => {
    setLoading(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));

    // Admin Login
    if (email.toLowerCase() === 'jsspn324@gmail.com') {
      if (pass === '571301' && department) {
         const adminUser: AuthUser = {
          name: 'Admin',
          email: 'jsspn324@gmail.com',
          role: 'admin',
          department,
          registerNumber: 'ADMIN_001',
          fatherName: 'N/A',
          motherName: 'N/A',
          photoURL: `https://picsum.photos/seed/admin/100/100`,
          contact: 'N/A',
          createdAt: new Date(),
        };
        setUser(adminUser);
        localStorage.setItem('faceattend_user', JSON.stringify(adminUser));
        router.push('/admin');
        setLoading(false);
        return;
      }
    }

    // Student Login
    const savedStudents: Student[] = JSON.parse(localStorage.getItem('students') || '[]');
    const allStudents = [...mockStudents, ...savedStudents];

    const foundStudent = allStudents.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (foundStudent && pass === foundStudent.registerNumber) {
      const studentUser: AuthUser = { ...foundStudent, role: 'student' };
      setUser(studentUser);
      localStorage.setItem('faceattend_user', JSON.stringify(studentUser));
      router.push('/student');
      setLoading(false);
      return;
    }

    setLoading(false);
    throw new Error('Invalid email or password');
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
