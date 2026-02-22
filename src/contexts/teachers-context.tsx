'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Teacher, TeachersContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { resizeAndCompressImage } from '@/lib/utils';

const ADMIN_EMAIL = "apdd46@gmail.com";

export const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();


  useEffect(() => {
    if (authLoading || !firestore) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }
    
    if (user?.role !== 'admin') {
      setTeachers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const teachersCollection = collection(firestore, 'teachers');
    const unsubscribe = onSnapshot(
      teachersCollection,
      (snapshot) => {
        const teacherData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                teacherId: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            } as Teacher;
        });
        setTeachers(teacherData);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'teachers',
          operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, authLoading]);

  const addTeacher = useCallback(async (
    teacherData: Omit<Teacher, 'teacherId' | 'createdAt' | 'updatedAt' | 'profilePhotoUrl'> & { password: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firestore) {
        return { success: false, error: 'Database not initialized.' };
    }

    const { email, password, subjects, ...details } = teacherData;
    let tempApp;
    
    try {
        if (email.toLowerCase() === ADMIN_EMAIL) {
            throw new Error("This email is reserved for the administrator.");
        }
        
        // 1. Fast duplicate check
        const teacherDocRef = doc(firestore, 'teachers', email);
        const existingTeacherSnap = await getDocs(query(collection(firestore, "teachers"), where("email", "==", email)));
        if (!existingTeacherSnap.empty) {
            throw new Error(`A teacher account with email ${email} already exists.`);
        }

        // 2. Auth creation (Sequential for reliability)
        const tempAppName = `teacher-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        
        await createUserWithEmailAndPassword(tempAuth, email, password);
        
        // 3. Firestore data save
        const newTeacherData = {
            ...details,
            email,
            teacherId: email,
            profilePhotoUrl: '',
            subjects: subjects || {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(teacherDocRef, newTeacherData);
        
        return { success: true };

    } catch (error: any) {
        console.error("Add teacher failed:", error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: 'This email address is already registered.' };
        }
        return { success: false, error: error.message };
    } finally {
        // Guaranteed cleanup
        if (tempApp) {
            deleteApp(tempApp).catch(() => {});
        }
    }
  }, [firestore]);
  
  const updateTeacher = useCallback(async (
    teacherId: string, 
    updates: Partial<Omit<Teacher, 'teacherId' | 'createdAt' | 'email' | 'profilePhotoUrl' | 'updatedAt'>> & { newPhotoFile?: File }
    ): Promise<void> => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      return;
    }
    const { newPhotoFile, subjects, ...otherUpdates } = updates;
    const teacherDocRef = doc(firestore, 'teachers', teacherId);

    const updatesToApply: { [key: string]: any } = { ...otherUpdates, subjects, updatedAt: serverTimestamp() };

    try {
        if (newPhotoFile) {
            const processedPhoto = await resizeAndCompressImage(newPhotoFile, 200, 0.6);
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `teachers/${teacherId}/profile.jpg`);
            await uploadBytes(photoRef, processedPhoto);
            const downloadURL = await getDownloadURL(photoRef);
            updatesToApply.profilePhotoUrl = downloadURL;
        }
        
        await updateDoc(teacherDocRef, updatesToApply);
        toast({ title: 'Teacher Updated', description: `Details saved.` });
    } catch (error: any) {
        const isPermissionError = error.code === 'permission-denied';
        if (isPermissionError) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'update', requestResourceData: updatesToApply }));
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteTeacher = useCallback((teacherId: string) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId);

    deleteDoc(teacherDocRef)
      .then(() => {
        toast({ title: 'Teacher Deleted', description: `Successfully removed teacher ${teacherId}.` });
        
        const storage = getStorage(firebaseApp);
        const photoRef = ref(storage, `teachers/${teacherId}/profile.jpg`);
        deleteObject(photoRef).catch(storageError => {
            if (storageError.code !== 'storage/object-not-found') {
                console.error("Failed to delete teacher photo from storage:", storageError);
            }
        });
      })
      .catch((error: any) => {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'delete' }));
        } else {
             toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        }
    });
  }, [firestore, firebaseApp, toast]);

  const value = { teachers, loading, addTeacher, updateTeacher, deleteTeacher };

  return (
    <TeachersContext.Provider value={value}>
      {children}
    </TeachersContext.Provider>
  );
}
