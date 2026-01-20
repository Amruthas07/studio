
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
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
  ): Promise<Student> => {
    if (!firestore || !firebaseApp) {
      throw new Error('Database not initialized. Please try again later.');
    }
    
    const { photoFile, ...studentDetails } = studentData;
    // The `studentDetails` object still contains the `photo: File` property from the form.
    // We must remove it before sending it to Firestore.
    const { photo, ...details } = studentDetails as any;

    const studentDocRef = doc(firestore, 'students', details.registerNumber);

    // Stage 1: Create student document immediately so UI can update
    const newStudent: Student = {
      ...details,
      profilePhotoUrl: '',
      photoHash: '', 
      createdAt: new Date(),
      photoEnrolled: false,
    };
    // This is an optimistic update. We create the student record right away.
    // `newStudent` no longer contains the illegal 'photo' property.
    await setDoc(studentDocRef, newStudent);

    // Stage 2: Handle photo processing in the background
    (async () => {
        const storage = getStorage(firebaseApp);
        const photoRef = ref(storage, `students/${details.registerNumber}/profile.jpg`);

        try {
            console.log("Starting background enrollment: Processing image...");
            const processedPhoto = await resizeAndCompressImage(photoFile);
            const photoHash = await getImageHash(processedPhoto);

            const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
            const duplicateSnap = await getDocs(duplicateQuery);
            if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== details.registerNumber) {
                 const duplicateStudent = duplicateSnap.docs[0].data();
                 throw new Error(`This photo is already enrolled for ${duplicateStudent.name}.`);
            }

            console.log(`Uploading photo for ${details.registerNumber}...`);
            const uploadTask = uploadBytesResumable(photoRef, processedPhoto);
            
            uploadTask.on('state_changed', 
                (snapshot) => { /* Progress can be logged here */ },
                (error) => {
                    console.error("Firebase Storage upload failed:", error);
                    toast({
                        variant: "destructive",
                        title: `Photo Upload Failed for ${details.name}`,
                        description: "Could not save photo to cloud storage.",
                    });
                },
                async () => { // On success
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const finalUpdate = {
                            profilePhotoUrl: downloadURL,
                            photoHash: photoHash,
                            photoEnrolled: true,
                            updatedAt: serverTimestamp(),
                        };
                        await updateDoc(studentDocRef, finalUpdate);
                        toast({
                            title: "Photo Enrolled",
                            description: `Photo for ${details.name} has been processed.`,
                        });
                    } catch (finalError: any) {
                         toast({
                            variant: "destructive",
                            title: `Enrollment Failed for ${details.name}`,
                            description: finalError.message || "Could not save photo details.",
                        });
                    }
                }
            );
        } catch (error: any) {
            console.error("Background enrollment failed:", error);
            toast({
                variant: "destructive",
                title: `Photo Enrollment Failed for ${details.name}`,
                description: error.message || "An unexpected error occurred.",
            });
        }
    })();
    
    return newStudent; // Return immediately after Stage 1
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

    // Handle just text updates
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

    // Handle photo re-enrollment
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

            const uploadTask = uploadBytesResumable(photoRef, processedPhoto);
            
            uploadTask.on('state_changed', null, 
                (error) => {
                    toast({ variant: "destructive", title: 'Photo Upload Failed', description: 'Please check your connection and try again.'});
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const finalUpdate = {
                        ...otherUpdates,
                        profilePhotoUrl: downloadURL,
                        photoHash: photoHash,
                        photoEnrolled: true,
                        updatedAt: serverTimestamp(),
                    };
                    await updateDoc(studentDocRef, finalUpdate);
                    toast({ title: "Photo Re-enrolled", description: `New photo saved for ${registerNumber}.` });
                }
            );
        } catch (error: any) {
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
        const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
        await deleteObject(photoRef).catch(error => {
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        });
        
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
