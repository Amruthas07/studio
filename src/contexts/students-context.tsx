"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Student } from '@/lib/types';
import { getInitialStudents } from '@/lib/mock-data';

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (registerNumber: string) => void;
}

export const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const initialStudents = getInitialStudents();
      setStudents(initialStudents);
    } catch (error) {
      console.error("Failed to load students data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistStudents = (updatedStudents: Student[]) => {
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    setStudents(updatedStudents);
  };

  const addStudent = useCallback((newStudent: Student) => {
    const updatedStudents = [...students, newStudent];
    persistStudents(updatedStudents);
  }, [students]);

  const updateStudent = useCallback((updatedStudent: Student) => {
    const updatedStudents = students.map(s => 
      s.registerNumber === updatedStudent.registerNumber ? updatedStudent : s
    );
    persistStudents(updatedStudents);
  }, [students]);

  const deleteStudent = useCallback((registerNumber: string) => {
    const updatedStudents = students.filter(s => s.registerNumber !== registerNumber);
    persistStudents(updatedStudents);
  }, [students]);
  
  const value = { students, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
