'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/firebase/provider';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { resizeAndCompressImage } from '@/lib/utils';
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
          setLoading(false);
        }
      );
    }

    return () => unsubscribe?.();
  }, [firestore, user, authLoading]);

  const addStudent = useCallback(async (
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt' | 'uid'>,
    photoFile?: File
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firestore || !firebaseApp) return { success: false, error: 'Database not ready' };

    let tempApp: any = null;
    try {
        // ULTRA-FAST PARALLEL PIPELINE:
        // 1. Auth Creation
        // 2. Image Optimization & Storage Upload (Concurrent with Auth)
        const storage = getStorage(firebaseApp);
        const photoRef = ref(storage, `students/${studentData.registerNumber}/profile.jpg`);

        const [userCredential, photoUrl] = await Promise.all([
            (async () => {
                const tempAppName = `enroll-${Date.now()}`;
                const tApp = initializeApp(firebaseConfig, tempAppName);
                const tAuth = getAuth(tApp);
                const cred = await createUserWithEmailAndPassword(tAuth, studentData.email, studentData.registerNumber);
                tempApp = tApp;
                return cred;
            })(),
            (async () => {
                if (!photoFile) return '';
                const optimized = await resizeAndCompressImage(photoFile);
                await uploadBytes(photoRef, optimized);
                return await getDownloadURL(photoRef);
            })()
        ]);

        const uid = userCredential.user.uid;
        const studentDocRef = doc(firestore, 'students', studentData.registerNumber);
        
        await setDoc(studentDocRef, {
            ...studentData,
            uid,
            profilePhotoUrl: photoUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Enrollment failed:", error);
        return { success: false, error: error.message || 'Enrollment failed' };
    } finally {
        if (tempApp) deleteApp(tempApp).catch(() => {});
    }
  }, [firestore, firebaseApp]);

  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ): Promise<void> => {
    if (!firestore || !firebaseApp) return;
    
    const { newPhotoFile, ...otherUpdates } = studentUpdate;
    const studentDocRef = doc(firestore, 'students', registerNumber);
    const updates: any = { ...otherUpdates, updatedAt: serverTimestamp() };
    
    try {
        if (newPhotoFile) {
            const processed = await resizeAndCompressImage(newPhotoFile);
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            await uploadBytes(photoRef, processed);
            updates.profilePhotoUrl = await getDownloadURL(photoRef);
        }
        await updateDoc(studentDocRef, updates);
        toast({ title: "Updated", description: "Student profile saved." });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
    if (!firestore || !firebaseApp) return;
    const student = students.find(s => s.registerNumber === registerNumber);
    if (!student) return;

    deleteDoc(doc(firestore, 'students', registerNumber))
      .then(() => {
        toast({ title: "Deleted", description: "Record removed." });
        if (student.profilePhotoUrl) {
            const storage = getStorage(firebaseApp);
            deleteObject(ref(storage, `students/${registerNumber}/profile.jpg`)).catch(() => {});
        }
      });
  }, [firestore, firebaseApp, toast, students]);

  return (
    <StudentsContext.Provider value={{ students, loading, addStudent, updateStudent, deleteStudent, setStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}
