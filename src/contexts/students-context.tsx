
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirestore, useFirebaseApp, useAuth as useFirebaseAuth } from '@/hooks/use-firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  const auth = useFirebaseAuth();
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
    if (!firestore || !firebaseApp || !auth) {
        throw new Error('Firebase services not initialized.');
    }

    const { photoFile, ...details } = studentData;

    // --- Part 1: Immediate validations ---
    const studentDocRef = doc(firestore, 'students', details.registerNumber);
    const existingStudentSnap = await getDoc(studentDocRef);
    if (existingStudentSnap.exists()) {
        throw new Error(`A student with register number ${details.registerNumber} already exists.`);
    }
    
    const q = query(collection(firestore, "students"), where("email", "==", details.email));
    const emailSnap = await getDocs(q);
    if (!emailSnap.empty) {
        throw new Error(`A student with email ${details.email} already exists.`);
    }

    // --- Part 2: Create Auth user ---
    try {
        await createUserWithEmailAndPassword(auth, details.email, details.registerNumber);
    } catch (error: any) {
        console.error("Failed to create student auth user:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already in use by another account.');
        }
         if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. It must be at least 6 characters.');
        }
        throw new Error(`Authentication error: ${error.message}`);
    }

    // --- Part 3: Save to Firestore and process photo ---
    const initialStudentData = {
        ...details,
        profilePhotoUrl: '', 
        photoHash: '', 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(studentDocRef, initialStudentData);

    // --- Part 4: Background photo processing ---
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

            await updateDoc(studentDocRef, {
                profilePhotoUrl: downloadURL,
                photoHash: photoHash,
                updatedAt: serverTimestamp(),
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Background Enrollment Failed",
                description: `Could not enroll photo for ${details.name}. Please try again from the student list. Reason: ${error.message}`,
                duration: 9000,
            });
        }
    })();
  }, [firestore, firebaseApp, auth, toast]);


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
        throw error;
    }

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
    // Note: This does not delete the Firebase Auth user, only Firestore data.
    // Deleting auth users from the client is a sensitive operation.
    
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: 'Student not found.' });
         return;
    }

    const storage = getStorage(firebaseApp);
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    if (studentToDelete.profilePhotoUrl) {
        try {
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            await deleteObject(photoRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.error("Failed to delete student photo from storage:", storageError);
                toast({
                    variant: "destructive",
                    title: "Delete Failed",
                    description: `Could not delete the student's photo. The student record was not deleted. Error: ${storageError.message}`,
                });
                return;
            }
        }
    }

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
