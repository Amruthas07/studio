
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
    
    const studentWithDateObjects = {
        ...newStudent,
        createdAt: new Date(newStudent.createdAt), 
        dateOfBirth: new Date(newStudent.dateOfBirth),
    };
    // Optimistic update: add to local state immediately
    setStudents(prevStudents => [...prevStudents, studentWithDateObjects]);

    // Save to firestore in the background
    const studentDocRef = doc(firestore, 'students', studentWithDateObjects.registerNumber);
    // No await here, let it run in the background. The onSnapshot listener will handle the final state.
    setDoc(studentDocRef, studentWithDateObjects).catch(error => {
        console.error("Failed to add student to Firestore:", error);
        // If it fails, remove the optimistically added student to keep UI consistent
        setStudents(prevStudents => prevStudents.filter(s => s.registerNumber !== newStudent.registerNumber));
    });
  }, [firestore]);

  const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student>) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    const updateData = { ...studentUpdate };
    
    if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    
    // No await here, optimistic update handled in component
    setDoc(studentDocRef, updateData, { merge: true }).catch(error => {
        console.error(`Failed to update student ${registerNumber} in Firestore:`, error);
        // Optionally handle rollback or notification here
    });
  }, [firestore]);

  const value = { students, setStudents, loading, addStudent, updateStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
