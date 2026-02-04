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
    setLoading(true);
    setTeachers([]);

    if (authLoading || !firestore) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }
    
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

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

  const addTeacher = useCallback(async (teacherData: Omit<Teacher, 'teacherId' | 'createdAt' | 'updatedAt' | 'profilePhotoUrl'> & { password: string }) => {
    if (!firestore) {
        throw new Error('Database not initialized.');
    }

    const { email, password, ...details } = teacherData;

    if (email.toLowerCase() === ADMIN_EMAIL) {
        throw new Error("This email is reserved for the administrator and cannot be used for a teacher.");
    }

    const q = query(collection(firestore, "teachers"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
        throw new Error(`A teacher with email ${email} already exists.`);
    }

    const tempAppName = `create-user-teacher-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        await createUserWithEmailAndPassword(tempAuth, email, password);
    } catch (error: any) {
        await deleteApp(tempApp);
        let message = error.message;
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already in use by another account.';
        }
        if (error.code === 'auth/weak-password') {
            message = 'Password must be at least 6 characters.';
        }
        throw new Error(message);
    } finally {
        await deleteApp(tempApp);
    }

    const teacherDocRef = doc(firestore, 'teachers', email);
    const newTeacherData = {
        ...details,
        email,
        teacherId: email,
        profilePhotoUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    setDoc(teacherDocRef, newTeacherData)
      .then(() => {
        toast({ title: 'Teacher Registered', description: `${details.name} can now log in.`});
      })
      .catch(error => {
         if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'create', requestResourceData: newTeacherData }));
        } else {
            toast({ variant: "destructive", title: "Database Error", description: error.message });
        }
    });

  }, [firestore, toast]);
  
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
