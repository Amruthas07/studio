'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp, getDoc, limit } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getImageHash, resizeAndCompressImage } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_EMAIL = "apdd46@gmail.com";

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!firestore || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }
    if (!user) {
      setStudents([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let unsubscribe: () => void;

    if (user.role === 'student') {
      const studentQuery = query(collection(firestore, 'students'), where('uid', '==', user.uid), limit(1));
      unsubscribe = onSnapshot(studentQuery,
        (querySnap) => {
          if (!querySnap.empty) {
            const docSnap = querySnap.docs[0];
            const data = docSnap.data();
            const studentData = {
              ...data,
              id: docSnap.id,
              registerNumber: docSnap.id,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            } as Student;
            setStudents([studentData]);
          } else {
            setStudents([]);
          }
          setLoading(false);
        },
        (err) => {
          const permissionError = new FirestorePermissionError({
            path: 'students',
            operation: 'list'
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        }
      );
    } else {
      let studentsQuery;
      const studentsCollection = collection(firestore, 'students');
      if (user.role === 'teacher' && user.department !== 'all') {
        studentsQuery = query(studentsCollection, where("department", "==", user.department));
      } else { // Admin or teacher with 'all' access
        studentsQuery = studentsCollection;
      }
      
      unsubscribe = onSnapshot(studentsQuery, 
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
        (err) => {
           const permissionError = new FirestorePermissionError({
            path: (studentsQuery as any)._query?.path?.canonicalString() || 'students',
            operation: 'list'
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        }
      );
    }

    return () => unsubscribe();
  }, [firestore, user, authLoading]);

  const addStudent = useCallback(async (
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt' | 'uid'> & { photoFile: File }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firestore || !firebaseApp) {
        return { success: false, error: 'Firebase services not initialized.' };
    }
    const { photoFile, ...details } = studentData;

    const tempAppName = `create-user-student-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    let userCredential: UserCredential | undefined;

    const studentDocRef = doc(firestore, 'students', details.registerNumber);

    try {
        if (details.email.toLowerCase() === ADMIN_EMAIL) {
            throw new Error("This email is reserved for the administrator.");
        }
        const existingStudentSnap = await getDoc(studentDocRef);
        if (existingStudentSnap.exists()) {
            throw new Error(`A student with register number ${details.registerNumber} already exists.`);
        }
        const q = query(collection(firestore, "students"), where("email", "==", details.email));
        const emailSnap = await getDocs(q);
        if (!emailSnap.empty) {
            throw new Error(`A student with email ${details.email} already exists.`);
        }

        const storage = getStorage(firebaseApp);
        const photoRef = ref(storage, `students/${details.registerNumber}/profile.jpg`);
        const processedPhoto = await resizeAndCompressImage(photoFile);
        const photoHash = await getImageHash(processedPhoto);

        const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
        const duplicateSnap = await getDocs(duplicateQuery);
        if (!duplicateSnap.empty) {
            throw new Error(`This photo is already enrolled for ${duplicateSnap.docs[0].data().name}.`);
        }

        await uploadBytes(photoRef, processedPhoto);
        const downloadURL = await getDownloadURL(photoRef);
        
        userCredential = await createUserWithEmailAndPassword(tempAuth, details.email, details.registerNumber);
        const uid = userCredential.user.uid;

        const newStudentData = {
            ...details,
            uid,
            profilePhotoUrl: downloadURL, 
            photoHash: photoHash, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(studentDocRef, newStudentData);
        
        return { success: true };

    } catch (error: any) {
        console.error("Add student failed:", error);
        
        if (userCredential) {
            await userCredential.user.delete().catch(e => console.warn("Auth user cleanup failed", e));
        }
        
        return { success: false, error: error.message };
    } finally {
        await deleteApp(tempApp);
    }
  }, [firestore, firebaseApp]);


  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ): Promise<void> => {
    if (!firestore || !firebaseApp) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database is not available." });
      return;
    }
    
    const { newPhotoFile, ...otherUpdates } = studentUpdate;
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    const updatesToApply: { [key: string]: any } = { ...otherUpdates, updatedAt: serverTimestamp() };
    
    try {
        if (newPhotoFile) {
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

            updatesToApply.profilePhotoUrl = downloadURL;
            updatesToApply.photoHash = photoHash;
        }

        await updateDoc(studentDocRef, updatesToApply);

        toast({
            title: "Student Updated",
            description: `Details for ${otherUpdates.name || registerNumber} have been saved.`,
        });
    } catch (error: any) {
        const isPermissionError = error.code === 'permission-denied';
        if (isPermissionError) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'update', requestResourceData: updatesToApply }));
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not save changes." });
        }
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
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
    
    deleteDoc(studentDocRef)
      .then(() => {
        toast({
          title: "Student Record Deleted",
          description: `${studentToDelete.name}'s record has been removed. Auth user cleanup will be attempted.`,
        });

        if (studentToDelete.profilePhotoUrl) {
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            deleteObject(photoRef).catch(storageError => {
                if (storageError.code !== 'storage/object-not-found') {
                    console.error("Failed to delete student photo from storage:", storageError);
                }
            });
        }
      })
      .catch(error => {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'delete' }));
        } else {
             toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete student. Error: ${error.message}` });
        }
    });
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
