"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { Student } from '@/lib/types';

type Role = 'admin' | 'student';

interface AuthUser extends Omit<Student, 'department'> {
    role: Role;
    department: Student['department'] | 'all';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string, department?: string, isAdminForm?: boolean) => Promise<void>;
  logout: () => void;
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
};
