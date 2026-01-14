
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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
    
    // Optimistic update: add to local state immediately
    setStudents(prevStudents => [...prevStudents, newStudent]);
    
    // Perform database operation in the background
    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
    
    // Return a promise that resolves when the UI action can proceed
    return setDoc(studentDocRef, newStudent).catch(error => {
      console.error("Failed to save student to Firestore:", error);
      // Revert local state on error
      setStudents(prevStudents => prevStudents.filter(s => s.registerNumber !== newStudent.registerNumber));
      toast({
          variant: "destructive",
          title: "Database Error",
          description: "Could not save the new student. Please try again."
      });
      // Propagate the error to stop the next action (like navigation)
      throw error;
    });
  }, [firestore, toast]);

  const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student>) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    // Optimistic update
    setStudents(prev => prev.map(s => s.registerNumber === registerNumber ? { ...s, ...studentUpdate } : s));

    const updateData = { ...studentUpdate };
    
    // Convert date back to a format Firestore understands if it's a JS Date object
    if (updateData.dateOfBirth instanceof Date) {
        updateData.dateOfBirth = updateData.dateOfBirth;
    }
    
    return setDoc(studentDocRef, updateData, { merge: true }).catch(error => {
        console.error("Failed to update student in Firestore:", error);
        // We could revert here, but it might be jarring. For now, log and toast.
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save changes to the database."
        });
        // Refetch to ensure consistency
        const studentsCollection = collection(firestore, 'students');
        onSnapshot(studentsCollection, (snapshot) => {
            const studentData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
            setStudents(studentData);
        });
        throw error;
    });
  }, [firestore, toast]);

  const value = { students, setStudents, loading, addStudent, updateStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
