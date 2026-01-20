
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

  const addStudent = useCallback((
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'photoEnrolled' | 'updatedAt'> & { photoFile: File },
    onSuccess: (newStudent: Student) => void
  ) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Enrollment Failed', description: 'Database not initialized.'});
      return;
    }

    const { photoFile, ...studentDetails } = studentData;
    const { photo, ...details } = studentDetails as any;

    const newStudent: Student = {
      ...details,
      profilePhotoUrl: '',
      photoHash: '', 
      createdAt: new Date(),
      photoEnrolled: false,
    };
    
    // Call success callback immediately for instant UI feedback
    onSuccess(newStudent);

    // Run all database and storage operations in the background
    (async () => {
        const studentDocRef = doc(firestore, 'students', details.registerNumber);
        try {
            const studentToSave = {
              ...details,
              profilePhotoUrl: '',
              photoHash: '', 
              createdAt: serverTimestamp(),
              photoEnrolled: false,
            };

            await setDoc(studentDocRef, studentToSave);
            
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

            // Using await uploadBytes for simpler promise-based handling
            await uploadBytes(photoRef, processedPhoto);
            
            const downloadURL = await getDownloadURL(photoRef);

            const finalUpdate = {
                profilePhotoUrl: downloadURL,
                photoHash: photoHash,
                photoEnrolled: true,
                updatedAt: serverTimestamp(),
            };
            await updateDoc(studentDocRef, finalUpdate);
            
        } catch (error: any) {
            console.error("Background enrollment failed:", error);
             // Cleanup: If background process fails, delete the partially created student doc
            await deleteDoc(studentDocRef).catch(delErr => console.error("Failed to cleanup orphaned student doc:", delErr));
            
            toast({
                variant: "destructive",
                title: `Enrollment Failed for ${details.name}`,
                description: error.message || "Could not save student. Please try again.",
            });
        }
    })();
  }, [firestore, firebaseApp, toast]);


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

    toast({ title: 'Re-enrolling Photo', description: 'Starting background photo update...' });
     (async () => {
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
        }
    })();
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
    
    try {
      // Attempt to delete photo, but don't let it block document deletion.
      try {
        const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
        await deleteObject(photoRef);
      } catch (storageError: any) {
        // A "not-found" error is okay, it means there was no photo to delete.
        if (storageError.code !== 'storage/object-not-found') {
          console.error("Photo deletion failed, but proceeding to delete document:", storageError);
        }
      }
      
      // Delete the Firestore document.
      const studentDocRef = doc(firestore, 'students', registerNumber);
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
    }
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
