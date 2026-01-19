
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
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { simpleHash, resizeAndCompressImage } from '@/lib/utils';

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
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

 const addStudent = useCallback(async (studentData: Omit<Student, 'photoURL' | 'faceId' | 'createdAt'>): Promise<Student> => {
    if (!firestore) {
      throw new Error('Firestore not initialized. Please try again later.');
    }
    
    if (students.some(s => s.registerNumber === studentData.registerNumber)) {
        throw new Error(`A student with Register Number ${studentData.registerNumber} already exists.`);
    }

    if (students.some(s => s.email.toLowerCase() === studentData.email.toLowerCase())) {
        throw new Error(`A student with the email ${studentData.email} already exists.`);
    }

    if (students.some(s => s.contact === studentData.contact)) {
        throw new Error(`A student with the contact number ${studentData.contact} already exists.`);
    }

    const newStudent: Student = {
      ...studentData,
      photoURL: '',
      faceId: '', // FaceID will be set on enrollment
      createdAt: new Date(),
    };

    try {
        const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
        await setDoc(studentDocRef, newStudent);
        
        setStudents(prev => [...prev, newStudent]);
        return newStudent;

    } catch (error) {
        console.error("Firestore add failed:", error);
        throw new Error("Could not save the new student to the database.");
    }
  }, [firestore, students]);

 const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student> & { newFacePhoto?: string }) => {
    if (!firestore || !firebaseApp) {
      throw new Error("Database not available. Please try again later.");
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const finalUpdate: Partial<Student> = { ...studentUpdate };
    const storage = getStorage(firebaseApp);

    if (finalUpdate.newFacePhoto) {
      const faceSignature = simpleHash(finalUpdate.newFacePhoto);
      const duplicateStudent = students.find(
        s => s.faceId === faceSignature && s.registerNumber !== registerNumber
      );

      if (duplicateStudent) {
        throw new Error(`This face is already enrolled for ${duplicateStudent.name} (${duplicateStudent.registerNumber}).`);
      }
      finalUpdate.faceId = faceSignature;

      try {
        const photoRef = ref(storage, `students/${registerNumber}/enrollment/profile.jpg`);
        const snapshot = await uploadString(photoRef, finalUpdate.newFacePhoto, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        finalUpdate.photoURL = downloadURL;

      } catch (error) {
        console.error("Firebase Storage upload failed:", error);
        throw new Error("Image Upload Failed: Could not save face image to cloud storage.");
      }
    }
    
    delete (finalUpdate as any).newFacePhoto;

    try {
      await setDoc(studentDocRef, finalUpdate, { merge: true });
    } catch (error) {
      console.error("Firestore update failed:", error);
      throw new Error(`Database Update Failed: Could not save changes for ${registerNumber}.`);
    }
  }, [firestore, firebaseApp, students]);
  
  const deleteStudent = useCallback(async (registerNumber: string) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: 'Student not found.' });
         return;
    }

    const storage = getStorage(firebaseApp);

    try {
        if (studentToDelete.photoURL) {
            const photoRef = ref(storage, `students/${registerNumber}/enrollment/profile.jpg`);
            await deleteObject(photoRef).catch(error => {
                if (error.code !== 'storage/object-not-found') {
                    throw error;
                }
            });
        }
        
        const studentDocRef = doc(firestore, 'students', registerNumber);
        await deleteDoc(studentDocRef);
        
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
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
