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
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getImageHash, resizeAndCompressImage } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

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
      } else { 
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
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt' | 'uid'>,
    photoFile?: File
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firestore || !firebaseApp) {
        return { success: false, error: 'Firebase services not initialized.' };
    }

    const details = studentData;

    try {
        // 1. Fast Pre-check
        const studentDocRef = doc(firestore, 'students', details.registerNumber);
        const existingSnap = await getDoc(studentDocRef);
        if (existingSnap.exists()) {
            return { success: false, error: `ID ${details.registerNumber} is already registered.` };
        }

        // 2. Parallel Tasks: Auth creation and Image processing
        const authPromise = (async () => {
            const tempAppName = `enroll-${Date.now()}`;
            const tApp = initializeApp(firebaseConfig, tempAppName);
            const tAuth = getAuth(tApp);
            const userCredential = await createUserWithEmailAndPassword(tAuth, details.email, details.registerNumber);
            return { uid: userCredential.user.uid, tApp };
        })();

        const imagePromise = (async () => {
            if (!photoFile) return { url: '', hash: '' };
            
            // Speed optimization: 200px is plenty for avatars and uploads in <1s
            const processedImage = await resizeAndCompressImage(photoFile, 200, 0.6);
            const photoHash = await getImageHash(processedImage);
            
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `students/${details.registerNumber}/profile.jpg`);
            
            await uploadBytes(photoRef, processedImage);
            const url = await getDownloadURL(photoRef);
            return { url, hash: photoHash };
        })();

        // Wait for both critical paths to complete
        const [authResult, imageResult] = await Promise.all([authPromise, imagePromise]);

        // 3. Save to Firestore
        const newStudentData = {
            ...details,
            uid: authResult.uid,
            profilePhotoUrl: imageResult.url,
            photoHash: imageResult.hash,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(studentDocRef, newStudentData);
        
        // 4. Background Cleanup
        deleteApp(authResult.tApp).catch(() => {});
        
        return { success: true };

    } catch (error: any) {
        console.error("Add student failed:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password (ID) must be at least 6 characters.";
        }
        return { success: false, error: errorMessage };
    }
  }, [firestore, firebaseApp]);


  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ): Promise<void> => {
    if (!firestore || !firebaseApp) return;
    
    const { newPhotoFile, ...otherUpdates } = studentUpdate;
    const studentDocRef = doc(firestore, 'students', registerNumber);
    const updatesToApply: { [key: string]: any } = { ...otherUpdates, updatedAt: serverTimestamp() };
    
    try {
        if (newPhotoFile) {
            const processedPhoto = await resizeAndCompressImage(newPhotoFile, 200, 0.6);
            const photoHash = await getImageHash(processedPhoto);
            
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            
            await uploadBytes(photoRef, processedPhoto);
            updatesToApply.profilePhotoUrl = await getDownloadURL(photoRef);
            updatesToApply.photoHash = photoHash;
        }

        await updateDoc(studentDocRef, updatesToApply);
        toast({ title: "Student Updated", description: `Details saved.` });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'update', requestResourceData: updatesToApply }));
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        }
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
    if (!firestore || !firebaseApp) return;
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) return;

    const storage = getStorage(firebaseApp);
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    deleteDoc(studentDocRef)
      .then(() => {
        toast({ title: "Deleted", description: `${studentToDelete.name} removed.` });
        if (studentToDelete.profilePhotoUrl) {
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            deleteObject(photoRef).catch(() => {});
        }
      })
      .catch(error => {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'delete' }));
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
