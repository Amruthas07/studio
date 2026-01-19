
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
import { simpleHash } from '@/lib/utils';

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

 const addStudent = useCallback(async (studentData: Omit<Student, 'photoURL' | 'faceId' | 'createdAt'>) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Firestore is not initialized. Please try again later.',
      });
      throw new Error('Firestore not initialized');
    }

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

    const newStudent: Student = {
      ...studentData,
      photoURL: '',
      faceId: '', // FaceID will be set on enrollment
      createdAt: new Date(),
    };

    const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);

    await setDoc(studentDocRef, newStudent);
    return newStudent;
  }, [firestore, toast, students]);

 const updateStudent = useCallback(async (registerNumber: string, studentUpdate: Partial<Student> & { newFacePhotos?: string[] }) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      throw new Error("Firebase services not initialized");
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const finalUpdate: Partial<Student> & { newFacePhotos?: string[] } = { ...studentUpdate };
    const storage = getStorage(firebaseApp);

    // If new face photos are being uploaded, handle the entire enrollment process.
    if (finalUpdate.newFacePhotos && finalUpdate.newFacePhotos.length > 0) {
      // 1. Check for duplicate faces using a hash of the first image as a signature.
      const faceSignature = simpleHash(finalUpdate.newFacePhotos[0]);
      const duplicateStudent = students.find(
        s => s.faceId === faceSignature && s.registerNumber !== registerNumber
      );

      if (duplicateStudent) {
        const errorMessage = `This face is already enrolled for ${duplicateStudent.name} (${duplicateStudent.registerNumber}).`;
        toast({
            variant: 'destructive',
            title: 'Enrollment Failed: Duplicate Face',
            description: errorMessage,
        });
        throw new Error(errorMessage);
      }
      finalUpdate.faceId = faceSignature;

      try {
        // 2. Upload all captured images to Firebase Storage in parallel.
        const uploadPromises = finalUpdate.newFacePhotos.map((photoDataUri, index) => {
          const photoRef = ref(storage, `student-photos/${registerNumber}-${index}.jpg`);
          return uploadString(photoRef, photoDataUri, 'data_url').then(snapshot => getDownloadURL(snapshot.ref));
        });
        const downloadURLs = await Promise.all(uploadPromises);
        
        // 3. Set the URLs for Firestore update.
        finalUpdate.photoURL = downloadURLs[0]; // Set first image as primary photoURL
        finalUpdate.facePhotoURLs = downloadURLs; // Store all image URLs

      } catch (error) {
        console.error("Firebase Storage upload failed:", error);
        toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Could not save face images to cloud storage. Please check your network and try again.",
        });
        throw error;
      }
    }
    
    // Remove temporary photos array before writing to Firestore
    delete finalUpdate.newFacePhotos;

    try {
      // 4. Save the final updates to the student document in Firestore.
      await setDoc(studentDocRef, finalUpdate, { merge: true });
      
      toast({
        title: "Update Successful",
        description: `Student ${registerNumber} has been updated.`,
      });
    } catch (error) {
      console.error("Firestore update failed:", error);
      toast({
        variant: "destructive",
        title: "Database Update Failed",
        description: `Could not save changes for ${registerNumber}.`,
      });
      throw error;
    }
  }, [firestore, firebaseApp, toast, students]);
  
  const deleteStudent = useCallback(async (registerNumber: string) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      throw new Error("Firebase services not initialized");
    }
    
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: 'Student not found.' });
         return;
    }

    const storage = getStorage(firebaseApp);

    try {
        // 1. Delete all associated photos from Storage
        const deletePromises: Promise<void>[] = [];
        if (studentToDelete.facePhotoURLs && studentToDelete.facePhotoURLs.length > 0) {
          studentToDelete.facePhotoURLs.forEach(url => {
            if(url) { // Ensure URL is not empty
              const photoRef = ref(storage, url);
              deletePromises.push(deleteObject(photoRef));
            }
          });
        } else if (studentToDelete.photoURL) {
          // Fallback for old single-photo structure
          const photoRef = ref(storage, studentToDelete.photoURL);
          deletePromises.push(deleteObject(photoRef));
        }

        // Wait for all deletions to attempt, but don't fail the whole process if one file is missing.
        await Promise.allSettled(deletePromises).then(results => {
            results.forEach(result => {
                if (result.status === 'rejected' && (result.reason as any)?.code !== 'storage/object-not-found') {
                    console.error("Could not delete a student photo:", result.reason);
                }
            });
        });

        // 2. Delete the student record from Firestore
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
