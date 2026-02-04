'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Teacher, TeachersContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_EMAIL = "apdd46@gmail.com";

export const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
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

    const { email, password, ...details } = teacherData;
    const teacherDocRef = doc(firestore, 'teachers', email);
    const tempAppName = `create-user-teacher-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        if (email.toLowerCase() === ADMIN_EMAIL) {
            throw new Error("This email is reserved for the administrator.");
        }
        const q = query(collection(firestore, "teachers"), where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) {
            throw new Error(`A teacher with email ${email} already exists.`);
        }

        await createUserWithEmailAndPassword(tempAuth, email, password);
        
        const newTeacherData = {
            ...details,
            email,
            teacherId: email,
            profilePhotoUrl: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(teacherDocRef, newTeacherData);
        
        return { success: true };

    } catch (error: any) {
        console.error("Add teacher failed:", error);
        // If any step fails, attempt to clean up the created auth user.
        try {
             if (tempAuth.currentUser) {
                await tempAuth.currentUser.delete();
             }
        } catch (cleanupError) {
            console.warn("Auth user cleanup failed. This can happen if the initial user creation also failed.", cleanupError);
        }
        return { success: false, error: error.message };
    } finally {
        await deleteApp(tempApp);
    }
  }, [firestore]);
  
  const updateTeacher = useCallback((teacherId: string, updates: Partial<Omit<Teacher, 'teacherId' | 'createdAt' | 'email' | 'profilePhotoUrl' | 'updatedAt'>>) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId);
    const dataToUpdate = { ...updates, updatedAt: serverTimestamp() };
    updateDoc(teacherDocRef, dataToUpdate)
      .then(() => {
        toast({ title: 'Teacher Updated', description: `Details for ${updates.name || teacherId} have been saved.` });
      })
      .catch((error: any) => {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'update', requestResourceData: dataToUpdate }));
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
  }, [firestore, toast]);
  
  const deleteTeacher = useCallback((teacherId: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId);
    deleteDoc(teacherDocRef)
      .then(() => {
        toast({ title: 'Teacher Deleted', description: `Successfully removed teacher ${teacherId}.` });
      })
      .catch((error: any) => {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'delete' }));
        } else {
             toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        }
    });
  }, [firestore, toast]);

  const value = { teachers, loading, addTeacher, updateTeacher, deleteTeacher };

  return (
    <TeachersContext.Provider value={value}>
      {children}
    </TeachersContext.Provider>
  );
}
