
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/hooks/use-firebase';
import type { Student } from '@/lib/types';

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (registerNumber: string) => Promise<void>;
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
                // Convert Firestore Timestamps to JS Date objects
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
    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
    // Use setDoc to create a new document with a specific ID (registerNumber)
    await setDoc(studentDocRef, {
        ...newStudent,
        createdAt: new Date(), // Ensure createdAt is a JS Date
    });
  }, [firestore]);

  const updateStudent = useCallback(async (updatedStudent: Student) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const studentDocRef = doc(firestore, 'students', updatedStudent.registerNumber);
    // When updating, only pass the fields that can be changed.
    const { registerNumber, createdAt, faceId, ...updateData } = updatedStudent;
    await updateDoc(studentDocRef, {
        ...updateData,
        dateOfBirth: new Date(updateData.dateOfBirth), // Ensure date is a JS Date
    });
  }, [firestore]);

  const deleteStudent = useCallback(async (registerNumber: string) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const studentDocRef = doc(firestore, 'students', registerNumber);
    await deleteDoc(studentDocRef);
  }, [firestore]);

  const value = { students, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
