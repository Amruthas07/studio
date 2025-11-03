
"use client";

import { useContext } from 'react';
import { StudentsContext } from '@/contexts/students-context';

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
};
