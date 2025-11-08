
"use client";

import { useContext } from 'react';
import { StudentsContext } from '@/contexts/students-context';
import type { Student } from '@/lib/types';

interface StudentsContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  loading: boolean;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (registerNumber: string, studentUpdate: Partial<Student>) => Promise<void>;
}


export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context as StudentsContextType;
};
