"use client";

import { useContext } from 'react';
import { TeachersContext } from '@/contexts/teachers-context';
import type { TeachersContextType } from '@/lib/types';

export const useTeachers = () => {
  const context = useContext(TeachersContext);
  if (context === undefined) {
    throw new Error('useTeachers must be used within a TeachersProvider');
  }
  return context as TeachersContextType;
};
