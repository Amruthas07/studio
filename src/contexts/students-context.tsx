
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
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt'> & { photoFile: File }
  ) => {
    if (!firestore || !firebaseApp) {
        throw new Error('Database not initialized.');
    }

    const { photoFile, ...details } = studentData;

    const existingStudentQuery = query(collection(firestore, "students"), where("registerNumber", "==", details.registerNumber));
    const querySnapshot = await getDocs(existingStudentQuery);
    if (!querySnapshot.empty) {
        throw new Error(`A student with register number ${details.registerNumber} already exists.`);
    }

    const studentDocRef = doc(firestore, 'students', details.registerNumber);

    // --- Part 1: Immediate write to Firestore ---
    const initialStudentData = {
        ...details,
        profilePhotoUrl: '', 
        photoHash: '', 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(studentDocRef, initialStudentData);

    // --- Part 2: Background photo processing and upload ---
    (async () => {
        try {
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

            // Update the document with photo info
            await updateDoc(studentDocRef, {
                profilePhotoUrl: downloadURL,
                photoHash: photoHash,
                updatedAt: serverTimestamp(),
            });
            // No success toast needed, UI updates via snapshot listener.
        } catch (error: any) {
             await updateDoc(studentDocRef, {
                updatedAt: serverTimestamp(),
            });
            // If background task fails, inform the user.
            toast({
                variant: "destructive",
                title: "Background Enrollment Failed",
                description: `Could not enroll photo for ${details.name}. Please try again from the student list. Reason: ${error.message}`,
                duration: 9000,
            });
        }
    })();
  }, [firestore, firebaseApp, toast]);


  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database is not available." });
      throw new Error("Database not available.");
    }
    
    const { newPhotoFile, ...otherUpdates } = studentUpdate;
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    // --- Part 1: Immediately update non-photo details ---
    const updatesToApply: any = { ...otherUpdates, updatedAt: serverTimestamp() };
    
    try {
        await updateDoc(studentDocRef, updatesToApply);
        toast({
            title: "Student Updated",
            description: `Details for ${otherUpdates.name || registerNumber} have been saved.`,
        });
    } catch (error: any) {
        console.error("Failed to update student details:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not save changes.",
        });
        // If the initial update fails, we throw the error to stop the process.
        throw error;
    }

    // --- Part 2: Handle photo update in the background ---
    if (newPhotoFile) {
        (async () => {
            try {
                const storage = getStorage(firebaseApp);
                const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);

                const processedPhoto = await resizeAndCompressImage(newPhotoFile);
                const photoHash = await getImageHash(processedPhoto);
                
                const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
                const duplicateSnap = await getDocs(duplicateQuery);
                if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== registerNumber) {
                    const duplicateStudent = duplicateSnap.docs[0].data();
                    throw new Error(`This photo is already in use for ${duplicateStudent.name}.`);
                }
                
                await uploadBytes(photoRef, processedPhoto);
                const downloadURL = await getDownloadURL(photoRef);
                
                // Update the document with photo info
                await updateDoc(studentDocRef, {
                    profilePhotoUrl: downloadURL,
                    photoHash: photoHash,
                    updatedAt: serverTimestamp(),
                });

                toast({
                    title: "Photo Updated",
                    description: `The new photo for ${otherUpdates.name || registerNumber} has been saved.`,
                });

            } catch (error: any) {
                console.error("Failed to update student photo in background:", error);
                toast({
                    variant: "destructive",
                    title: "Background Photo Update Failed",
                    description: error.message || "Could not save the new photo.",
                    duration: 9000,
                });
            }
        })();
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
    
    // Step 1: Try to delete the photo from Storage first.
    if (studentToDelete.profilePhotoUrl) {
        try {
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            await deleteObject(photoRef);
        } catch (storageError: any) {
            // If the photo doesn't exist, it's fine. We can continue.
            // If any other error occurs, we stop and notify the user.
            if (storageError.code !== 'storage/object-not-found') {
                console.error("Failed to delete student photo from storage:", storageError);
                toast({
                    variant: "destructive",
                    title: "Delete Failed",
                    description: `Could not delete the student's photo. The student record was not deleted. Error: ${storageError.message}`,
                });
                return; // Stop the process if photo deletion fails.
            }
        }
    }

    // Step 2: If photo deletion was successful (or not needed), delete the Firestore document.
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
            description: `Could not delete the student record for ${studentToDelete.name}. Error: ${error.message}`,
        });
    }
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
