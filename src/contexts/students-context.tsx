
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Student } from '@/lib/types';
// Note: getInitialStudents is no longer used as data comes from Firestore.

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
    // In a real Firestore implementation, you would set up a listener here.
    // For now, we'll start with an empty list.
    setStudents([]);
    setLoading(false);
  }, []);

  // These functions will be updated to interact with Firestore.
  const addStudent = useCallback((newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    // Firestore logic to add a document would go here.
  }, []);

  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents(prev => prev.map(s => 
      s.registerNumber === updatedStudent.registerNumber ? updatedStudent : s
    ));
    // Firestore logic to update a document would go here.
  }, []);

  const deleteStudent = useCallback((registerNumber: string) => {
    setStudents(prev => prev.filter(s => s.registerNumber !== registerNumber));
    // Firestore logic to delete a document would go here.
  }, []);
  
  const value = { students, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
