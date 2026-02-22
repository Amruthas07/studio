"use client";

import { useContext } from 'react';
import { AuthContext, type AuthUser } from '@/contexts/auth-context';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
};
