
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

    // Rule: Only one HOD per department
    if (teacherData.position === 'HOD') {
        const hodExists = teachers.some(t => t.department === teacherData.department && t.position === 'HOD');
        if (hodExists) {
            return { success: false, error: `Validation Error: An HOD already exists for the ${teacherData.department.toUpperCase()} department.` };
        }
    }

    const emailNormalized = teacherData.email.toLowerCase();
    const { password, subjects, ...details } = teacherData;
    let tempApp: any = null;
    
    try {
        if (emailNormalized === ADMIN_EMAIL.toLowerCase()) {
            throw new Error("This email is reserved for the administrator.");
        }
        
        const tempAppName = `teacher-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tAuth = getAuth(tempApp);
        await createUserWithEmailAndPassword(tAuth, emailNormalized, password);

        // Firestore data save
        const teacherDocRef = doc(firestore, 'teachers', emailNormalized);
        const newTeacherData = {
            ...details,
            email: emailNormalized,
            teacherId: emailNormalized,
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
        if (tempApp) {
            deleteApp(tempApp).catch(() => {});
        }
    }
  }, [firestore, teachers]);
  
  const updateTeacher = useCallback(async (
    teacherId: string, 
    updates: Partial<Omit<Teacher, 'teacherId' | 'createdAt' | 'email' | 'profilePhotoUrl' | 'updatedAt'>>
    ): Promise<void> => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      return;
    }

    const currentTeacher = teachers.find(t => t.teacherId === teacherId);
    if (!currentTeacher) return;

    // Rule: Only one HOD per department
    const targetDept = updates.department || currentTeacher.department;
    const targetPosition = updates.position || currentTeacher.position;

    if (targetPosition === 'HOD') {
        const hodExists = teachers.some(t => 
            t.department === targetDept && 
            t.position === 'HOD' && 
            t.teacherId !== teacherId
        );
        if (hodExists) {
            toast({ 
                variant: 'destructive', 
                title: 'Update Blocked', 
                description: `The ${targetDept.toUpperCase()} department already has an HOD assigned.` 
            });
            return;
        }
    }

    const { subjects, ...otherUpdates } = updates;
    const teacherDocRef = doc(firestore, 'teachers', teacherId.toLowerCase());

    const updatesToApply: { [key: string]: any } = { ...otherUpdates, subjects, updatedAt: serverTimestamp() };

    try {
        await updateDoc(teacherDocRef, updatesToApply);
        toast({ title: 'Teacher Updated', description: `Details saved successfully.` });
    } catch (error: any) {
        const isPermissionError = error.code === 'permission-denied';
        if (isPermissionError) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: teacherDocRef.path, operation: 'update', requestResourceData: updatesToApply }));
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    }
  }, [firestore, toast, teachers]);
  
  const deleteTeacher = useCallback((teacherId: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId.toLowerCase());

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
