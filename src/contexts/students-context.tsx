
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
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

 const addStudent = useCallback(async (studentData: Omit<Student, 'photoURL' | 'photoHash' | 'createdAt' | 'photoEnrolled'>): Promise<Student> => {
    if (!firestore) {
      throw new Error('Firestore not initialized. Please try again later.');
    }
    
    const studentDocRef = doc(firestore, 'students', studentData.registerNumber);

    const newStudent: Student = {
      ...studentData,
      photoURL: '',
      photoHash: '', 
      createdAt: new Date(),
      photoEnrolled: false,
    };

    try {
        console.log(`Enrolling student ${newStudent.registerNumber} by queuing a write operation...`);
        await setDoc(studentDocRef, newStudent);
        console.log("Student enrollment write operation was successfully queued.");
        
        return newStudent;

    } catch (error) {
        console.error("Firestore add failed:", error);
        throw new Error("Could not save the new student. Please check your permissions or network.");
    }
  }, [firestore]);

  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Student> & { newPhotoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "Database is not available. Please try again later.",
      });
      return;
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    const { newPhotoFile, ...otherUpdates } = studentUpdate;

    if (!newPhotoFile) {
      // This is for updating student details without changing the photo.
      try {
        await setDoc(studentDocRef, otherUpdates, { merge: true });
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

    // Logic for photo enrollment
    const storage = getStorage(firebaseApp);
    const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);

    try {
      console.log("Starting enrollment: Hashing photo...");
      const photoHash = await getImageHash(newPhotoFile);

      console.log("Checking for duplicate photo hash...");
      const q = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
      const duplicateSnap = await getDocs(q);

      if (!duplicateSnap.empty) {
        const duplicateStudent = duplicateSnap.docs[0].data();
        if (duplicateStudent.registerNumber !== registerNumber) {
          throw new Error(`This photo is already enrolled for ${duplicateStudent.name} (${duplicateStudent.registerNumber}).`);
        }
      }

      console.log(`Starting photo upload for ${registerNumber}...`);
      const uploadTask = uploadBytesResumable(photoRef, newPhotoFile, { contentType: newPhotoFile.type });

      // This is a fire-and-forget upload. We listen to the final state.
      uploadTask.on('state_changed',
        (snapshot) => {
          // Can be used for progress, but we are navigating away.
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle upload failure
          console.error("Firebase Storage upload failed:", error);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Could not save face image to cloud storage. Please check your network.",
          });
        },
        async () => {
          // Handle successful upload
          try {
            console.log("Upload complete. Getting download URL...");
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const finalUpdate: Partial<Student> = {
              ...otherUpdates,
              photoURL: downloadURL,
              photoHash: photoHash,
              photoEnrolled: true,
            };

            console.log('Saving metadata to Firestore...');
            await setDoc(studentDocRef, finalUpdate, { merge: true });
            console.log('Firestore write complete.');
            
            toast({
              title: "Enrollment Successful!",
              description: `Photo has been successfully enrolled for student ${registerNumber}.`,
            });
          } catch (error: any) {
            console.error("Failed post-upload:", error);
            toast({
              variant: "destructive",
              title: "Enrollment Finalization Failed",
              description: error.message || "Could not save photo details to database.",
            });
          }
        }
      );
    } catch (error: any) {
      console.error("Pre-upload enrollment step failed:", error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: error.message || "An unexpected error occurred before upload.",
      });
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
