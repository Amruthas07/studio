
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytesResumable, UploadTask } from 'firebase/storage';
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
    
    console.log("Starting student enrollment: Checking for duplicates...");
    const studentsRef = collection(firestore, 'students');
    const studentDocRef = doc(firestore, 'students', studentData.registerNumber);

    const [regNumSnap, emailSnap, contactSnap] = await Promise.all([
        getDoc(studentDocRef),
        getDocs(query(studentsRef, where('email', '==', studentData.email.toLowerCase()))),
        getDocs(query(studentsRef, where('contact', '==', studentData.contact))),
    ]);

    if (regNumSnap.exists()) {
        throw new Error(`A student with Register Number ${studentData.registerNumber} already exists.`);
    }
    if (!emailSnap.empty) {
        throw new Error(`A student with the email ${studentData.email} already exists.`);
    }
    if (!contactSnap.empty) {
        throw new Error(`A student with the contact number ${studentData.contact} already exists.`);
    }
    console.log("Duplicate checks passed.");

    const newStudent: Student = {
      ...studentData,
      photoURL: '',
      photoHash: '', 
      createdAt: new Date(),
    };

    try {
        console.log(`Enrolling student ${newStudent.registerNumber}...`);
        await setDoc(studentDocRef, newStudent);
        console.log("Student enrolled successfully in Firestore.");
        
        return newStudent;

    } catch (error) {
        console.error("Firestore add failed:", error);
        throw new Error("Could not save the new student to the database.");
    }
  }, [firestore]);

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
        onProgress?.(5);
        console.log("Starting enrollment: Hashing photo...");
        const photoHash = await getImageHash(newPhotoFile);
        
        console.log("Checking for duplicate photo hash...");
        onProgress?.(10);
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
        delete (finalUpdate as any).newPhotoFile;

        const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
        
        const uploadFileWithTimeout = () => new Promise<string>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(photoRef, newPhotoFile, { contentType: newPhotoFile.type });
            
            const timeout = setTimeout(() => {
                uploadTask.cancel();
                reject(new Error("Enrollment timed out."));
            }, 15000); // 15 second timeout

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = 10 + (snapshot.bytesTransferred / snapshot.totalBytes) * 80; // Scale 10-90%
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    clearTimeout(timeout);
                    console.error("Firebase Storage upload failed:", error);
                    reject(new Error("Image Upload Failed: Could not save face image to cloud storage."));
                },
                async () => {
                    try {
                        clearTimeout(timeout);
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (urlError) {
                        console.error("Failed to get download URL:", urlError);
                        reject(new Error("Failed to get image URL after upload."));
                    }
                }
            );
        });

        let downloadURL = '';
        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Upload attempt ${attempt}...`);
                downloadURL = await uploadFileWithTimeout();
                console.log("Upload successful.");
                break; // Break loop on success
            } catch (error: any) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    throw new Error("Enrollment failed after multiple attempts. Please check your network and try again.");
                }
                // Wait 1 second before retrying
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        finalUpdate.photoURL = downloadURL;
        
        onProgress?.(95);
        console.log('Saving metadata to Firestore...');
        await setDoc(studentDocRef, finalUpdate, { merge: true });
        console.log('Firestore write complete.');
        onProgress?.(100);

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
