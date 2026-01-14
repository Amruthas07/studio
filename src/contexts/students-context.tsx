
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/hooks/use-firebase';
import type { Student } from '@/lib/types';

interface StudentsContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  loading: boolean;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (registerNumber: string, studentUpdate: Partial<Student>) => Promise<void>;
}

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    };
    
    setLoading(true);
    const studentsCollection = collection(firestore, 'students');
    const unsubscribe = onSnapshot(
      studentsCollection,
      (snapshot) => {
        const studentData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
            } as Student;
        });
        setStudents(studentData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const addStudent = useCallback(async (newStudent: Student) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    // Optimistically update the local state
    setStudents(prev => [...prev, newStudent]);
    
    // Perform the database operation in the background without awaiting
    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
    setDoc(studentDocRef, newStudent).catch(error => {
      console.error("Failed to add student to Firestore:", error);
      // Optionally, revert the optimistic update here if the write fails
      setStudents(prev => prev.filter(s => s.registerNumber !== newStudent.registerNumber));
    });

  }, [firestore]);

  const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student>) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    const updateData = { ...studentUpdate };
    
    if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    
    // Perform the database operation and wait for it to complete
    await setDoc(studentDocRef, updateData, { merge: true });
    
    // Update local state after successful DB operation
    setStudents(prev => 
      prev.map(s => s.registerNumber === registerNumber ? {...s, ...studentUpdate} : s)
    );
  }, [firestore]);

  const value = { students, setStudents, loading, addStudent, updateStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
