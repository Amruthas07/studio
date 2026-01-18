
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirestore } from '@/hooks/use-firebase';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  const addStudent = useCallback((newStudent: Student) => {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Database Error",
            description: "Firestore is not initialized. Please try again later."
        });
        return;
    }
    
    setStudents(prevStudents => [...prevStudents, newStudent]);
    
    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
    
    setDoc(studentDocRef, newStudent).catch(error => {
      console.error("Failed to save student to Firestore:", error);
      setStudents(prevStudents => prevStudents.filter(s => s.registerNumber !== newStudent.registerNumber));
      toast({
          variant: "destructive",
          title: "Database Error",
          description: "Could not save the new student. Please try again."
      });
    });
  }, [firestore, toast]);

 const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student>) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      throw new Error("Firestore is not initialized");
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const finalUpdate = { ...studentUpdate };

    // Optimistically update the UI with the local base64 image or other data
    setStudents(prev => prev.map(s => s.registerNumber === registerNumber ? { ...s, ...finalUpdate } : s));

    try {
      // If a new photo is being uploaded (as a base64 data URI), handle the upload
      if (finalUpdate.photoURL && finalUpdate.photoURL.startsWith('data:image')) {
        const storage = getStorage();
        // Use .jpg for the uploaded file
        const storageRef = ref(storage, `student-photos/${registerNumber}.jpg`);
        
        const snapshot = await uploadString(storageRef, finalUpdate.photoURL, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // The final update to Firestore should use the download URL
        finalUpdate.photoURL = downloadURL;
      }
      
      await setDoc(studentDocRef, finalUpdate, { merge: true });

      // If we got a new download URL, update the optimistic state to the permanent state
      if (finalUpdate.photoURL && finalUpdate.photoURL.startsWith('https')) {
        setStudents(prev => prev.map(s => s.registerNumber === registerNumber ? { ...s, photoURL: finalUpdate.photoURL! } : s));
      }

      toast({
        title: "Update Successful",
        description: `Student ${registerNumber} has been updated.`,
      });
    } catch (error) {
      console.error("Failed to update student:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Could not save changes for ${registerNumber}.`,
      });
      throw error;
    }
  }, [firestore, toast]);

  const value = { students, setStudents, loading, addStudent, updateStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
