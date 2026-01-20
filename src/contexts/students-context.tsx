
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getImageHash } from '@/lib/utils';

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
                registerNumber: doc.id, // Ensure registerNumber is consistent with doc ID
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

 const addStudent = useCallback(async (studentData: Omit<Student, 'photoURL' | 'photoHash' | 'createdAt'>): Promise<Student> => {
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
      photoHash: '', 
      createdAt: new Date(),
    };

    try {
        const studentDocRef = doc(firestore, 'students', newStudent.registerNumber);
        await setDoc(studentDocRef, newStudent);
        
        // No need for setStudents, onSnapshot will handle it.
        return newStudent;

    } catch (error) {
        console.error("Firestore add failed:", error);
        throw new Error("Could not save the new student to the database.");
    }
  }, [firestore, students]);

 const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Student> & { newPhotoFile?: File },
    onProgress?: (progress: number) => void
  ) => {
    if (!firestore || !firebaseApp) {
      throw new Error("Database not available. Please try again later.");
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const finalUpdate: Partial<Student> = { ...studentUpdate };
    const storage = getStorage(firebaseApp);
    const { newPhotoFile } = studentUpdate;

    if (newPhotoFile) {
        console.log("Starting enrollment: Hashing photo...");
        const photoHash = await getImageHash(newPhotoFile);
        
        console.log("Checking for duplicate photo hash...");
        const q = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
        const duplicateSnap = await getDocs(q);

        if (!duplicateSnap.empty) {
            const duplicateStudent = duplicateSnap.docs[0].data();
            if (duplicateStudent.registerNumber !== registerNumber) {
                console.error("Duplicate photo detected.");
                throw new Error(`This photo is already enrolled for ${duplicateStudent.name} (${duplicateStudent.registerNumber}).`);
            }
        }
        
        finalUpdate.photoHash = photoHash;

        const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
        const uploadTask = uploadBytesResumable(photoRef, newPhotoFile, { contentType: newPhotoFile.type });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                uploadTask.cancel();
                reject(new Error("Enrollment timed out. Please check your network and try again."));
            }, 30000); // 30 second timeout

            uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
                 console.log(`Upload Progress: ${progress}%`);
            },
            (error) => {
                clearTimeout(timeout);
                console.error("Firebase Storage upload failed:", error);
                reject(new Error("Image Upload Failed: Could not save face image to cloud storage."));
            },
            async () => {
                try {
                    clearTimeout(timeout);
                    console.log('Upload complete, getting download URL...');
                    if (onProgress) onProgress(100);
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    finalUpdate.photoURL = downloadURL;
                    delete (finalUpdate as any).newPhotoFile;

                    console.log('Saving metadata to Firestore...');
                    await setDoc(studentDocRef, finalUpdate, { merge: true });
                    console.log('Firestore write complete.');
                    resolve();
                } catch (dbError) {
                    console.error("Firestore update or URL fetch failed:", dbError);
                    reject(new Error(`Database Update Failed: Could not save changes for ${registerNumber}.`));
                }
            }
            );
        });
    } else {
        // This case handles edits without photo change
        await setDoc(studentDocRef, finalUpdate, { merge: true });
    }
  }, [firestore, firebaseApp]);
  
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
