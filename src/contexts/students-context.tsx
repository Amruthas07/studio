'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
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

 const addStudent = useCallback(async (studentData: Omit<Student, 'photoURL' | 'faceId' | 'createdAt'>) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Firestore is not initialized. Please try again later.',
      });
      throw new Error('Firestore not initialized');
    }

    // --- START DUPLICATE CHECKS ---
    if (students.some(s => s.registerNumber === studentData.registerNumber)) {
        toast({
        variant: "destructive",
        title: "Duplicate Student",
        description: `A student with Register Number ${studentData.registerNumber} already exists.`,
        });
        throw new Error("Duplicate Register Number");
    }

    if (students.some(s => s.email.toLowerCase() === studentData.email.toLowerCase())) {
        toast({
        variant: "destructive",
        title: "Duplicate Email",
        description: `A student with the email ${studentData.email} already exists.`,
        });
        throw new Error("Duplicate Email");
    }

    if (students.some(s => s.contact === studentData.contact)) {
        toast({
        variant: "destructive",
        title: "Duplicate Contact",
        description: `A student with the contact number ${studentData.contact} already exists.`,
        });
        throw new Error("Duplicate Contact");
    }
    // --- END DUPLICATE CHECKS ---

    const newStudent: Student = {
      ...studentData,
      photoURL: '',
      faceId: `face_${studentData.registerNumber}_${Date.now()}`,
      createdAt: new Date(),
    };

    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);

    await setDoc(studentDocRef, newStudent);
    
    // Optimistically update UI, but Firestore is now the source of truth on next snapshot
    setStudents(prev => [...prev, newStudent]);
    
    return newStudent;
  }, [firestore, toast, students]);

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
  
  const deleteStudent = useCallback(async (registerNumber: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      throw new Error("Firestore is not initialized");
    }
    
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: 'Student not found.' });
         return;
    }

    try {
        // 1. Delete from Firestore
        const studentDocRef = doc(firestore, 'students', registerNumber);
        await deleteDoc(studentDocRef);

        // 2. Delete photo from Storage if it exists
        if (studentToDelete.photoURL) {
            const storage = getStorage();
            const photoRef = ref(storage, `student-photos/${registerNumber}.jpg`);
            // We can try to delete, but if it fails (e.g. file not found), we don't want to block the whole process.
            try {
                await deleteObject(photoRef);
            } catch (storageError: any) {
                // If file doesn't exist, that's fine. Log other errors.
                if (storageError.code !== 'storage/object-not-found') {
                    console.error("Could not delete student photo:", storageError);
                }
            }
        }
        
        // 3. Update local state (optimistic)
        // Note: onSnapshot will also update this, but this makes the UI faster.
        setStudents(prev => prev.filter(s => s.registerNumber !== registerNumber));
        
        toast({
            title: "Student Deleted",
            description: `Successfully removed ${studentToDelete.name}.`,
        });

    } catch (error) {
        console.error("Failed to delete student:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: `Could not delete student ${registerNumber}.`,
        });
        throw error;
    }
  }, [firestore, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
