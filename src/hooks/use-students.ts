
"use client";

import { useContext } from 'react';
import { StudentsContext } from '@/contexts/students-context';
import type { StudentsContextType } from '@/lib/types';

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context as StudentsContextType;
};
