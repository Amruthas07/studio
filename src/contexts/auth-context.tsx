"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mockStudents } from '@/lib/mock-data';
import type { Student } from '@/lib/types';

type Role = 'admin' | 'student';

interface AuthContextType {
  user: (Student & { role: Role }) | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(Student & { role: Role }) | null>(null);
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

  const login = async (email: string, pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));

    if (email.toLowerCase() === 'jsspn324@gmail.com') {
      const validSuffixes = ['cs', 'ce', 'me', 'ee', 'mce', 'ec'];
      const passwordIsValid = validSuffixes.some(suffix => pass === `571301${suffix}`);

      if (passwordIsValid) {
        const department = pass.replace('571301', '') as Student['department'];
        const adminUser = {
          name: 'Admin',
          email: 'jsspn324@gmail.com',
          role: 'admin' as Role,
          department,
          // Add other student fields with dummy data
          registerNumber: 'ADMIN_001',
          fatherName: 'N/A',
          motherName: 'N/A',
          photoURL: 'https://picsum.photos/seed/admin/100/100',
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

    const foundStudent = mockStudents.find(s => s.email === email);
    if (foundStudent) {
      const studentUser = { ...foundStudent, role: 'student' as Role };
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
