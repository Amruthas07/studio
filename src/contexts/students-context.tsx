
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getImageHash, resizeAndCompressImage } from '@/lib/utils';

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
                registerNumber: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
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

  const addStudent = useCallback(async (
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'photoEnrolled' | 'updatedAt'> & { photoFile: File }
  ) => {
    if (!firestore || !firebaseApp) {
      throw new Error('Database not initialized.');
    }

    const { photoFile, ...details } = studentData;
    const studentDocRef = doc(firestore, 'students', details.registerNumber);
    
    const storage = getStorage(firebaseApp);
    const photoRef = ref(storage, `students/${details.registerNumber}/profile.jpg`);

    const processedPhoto = await resizeAndCompressImage(photoFile);
    const photoHash = await getImageHash(processedPhoto);

    const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== details.registerNumber) {
          const duplicateStudent = duplicateSnap.docs[0].data();
          throw new Error(`This photo is already enrolled for ${duplicateStudent.name}.`);
    }

    await uploadBytes(photoRef, processedPhoto);
    const downloadURL = await getDownloadURL(photoRef);

    const studentToSave = {
      ...details,
      profilePhotoUrl: downloadURL,
      photoHash: photoHash, 
      createdAt: serverTimestamp(),
      photoEnrolled: true,
      updatedAt: serverTimestamp(),
    };

    await setDoc(studentDocRef, studentToSave);
    
    // Return the newly created student data for the UI
    return {
      ...details,
      profilePhotoUrl: downloadURL,
      photoHash: photoHash,
      createdAt: new Date(),
      photoEnrolled: true,
      updatedAt: new Date(),
    } as Student;
  }, [firestore, firebaseApp]);


  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Student> & { newPhotoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Database is not available. Please try again later.",
      });
      return;
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const { newPhotoFile, ...otherUpdates } = studentUpdate;

    if (!newPhotoFile) {
      try {
        await updateDoc(studentDocRef, {...otherUpdates, updatedAt: serverTimestamp()});
        toast({
          title: "Student Updated",
          description: `Details for ${registerNumber} have been saved.`,
        });
      } catch (error: any) {
        console.error("Failed to update student details:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Could not save changes.",
        });
      }
      return;
    }

    const storage = getStorage(firebaseApp);
    const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);

    try {
        const processedPhoto = await resizeAndCompressImage(newPhotoFile);
        const photoHash = await getImageHash(processedPhoto);

        const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
        const duplicateSnap = await getDocs(duplicateQuery);
        if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== registerNumber) {
              throw new Error(`This photo is already in use by ${duplicateSnap.docs[0].data().name}.`);
        }

        await uploadBytes(photoRef, processedPhoto);
        const downloadURL = await getDownloadURL(photoRef);
        
        const finalUpdate = {
            ...otherUpdates,
            profilePhotoUrl: downloadURL,
            photoHash: photoHash,
            photoEnrolled: true,
            updatedAt: serverTimestamp(),
        };
        await updateDoc(studentDocRef, finalUpdate);
        toast({ title: "Photo Re-enrolled", description: `New photo saved for ${registerNumber}.` });

    } catch (error: any) {
          console.error("Photo re-enrollment failed:", error);
          toast({ variant: "destructive", title: 'Re-enrollment Failed', description: error.message });
          throw error; // Re-throw to let the caller know it failed
    }
  }, [firestore, firebaseApp, toast]);
  
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
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    // First, try to delete the firestore document
    try {
      await deleteDoc(studentDocRef);
      toast({
          title: "Student Deleted",
          description: `Successfully removed ${studentToDelete.name}.`,
      });

    } catch (error: any) {
        console.error("Failed to delete student document:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: `Could not delete ${studentToDelete.name}. ${error.message}`,
        });
        // If document deletion fails, don't proceed to delete the photo
        return;
    }

    // If document deletion is successful, then try to delete the photo
    try {
      const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
      await deleteObject(photoRef);
    } catch (storageError: any) {
      // If photo doesn't exist, it's not a critical error.
      if (storageError.code !== 'storage/object-not-found') {
        console.warn("Background photo deletion failed, but document was deleted:", storageError);
         toast({
            variant: "destructive",
            title: "Partial Deletion",
            description: `Student record was deleted, but the photo could not be removed from storage.`,
        });
      }
    }
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
