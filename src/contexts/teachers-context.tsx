
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/hooks/use-firebase';
import type { Teacher, TeachersContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    };
    
    setLoading(true);
    const teachersCollection = collection(firestore, 'teachers');
    const unsubscribe = onSnapshot(
      teachersCollection,
      (snapshot) => {
        const teacherData = snapshot.docs.map(doc => {
            const data = doc.data();
            // If profilePhotoUrl is a placeholder from picsum, set it to empty string to show fallback.
            const profilePhotoUrl = data.profilePhotoUrl?.includes('picsum.photos') 
                ? '' 
                : data.profilePhotoUrl;

            return {
                ...data,
                teacherId: doc.id,
                profilePhotoUrl,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            } as Teacher;
        });
        setTeachers(teacherData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching teachers:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const addTeacher = useCallback(async (teacherData: Omit<Teacher, 'teacherId' | 'createdAt' | 'updatedAt' | 'profilePhotoUrl'> & { password: string }) => {
    if (!firestore) {
        throw new Error('Database not initialized.');
    }

    const { email, password, ...details } = teacherData;

    // Perform the duplicate check first. This is awaited and will throw if a duplicate is found.
    const existingTeacherQuery = query(collection(firestore, "teachers"), where("email", "==", email));
    const querySnapshot = await getDocs(existingTeacherQuery);
    if (!querySnapshot.empty) {
        throw new Error(`A teacher with email ${email} already exists.`);
    }

    // If validation passes, proceed with creating the document in the background.
    const teacherDocRef = doc(firestore, 'teachers', email);
    const newTeacherData = {
        ...details,
        email,
        password,
        teacherId: email,
        profilePhotoUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Don't await setDoc. Handle success/failure with toasts.
    // The UI updates from the onSnapshot listener, so a success toast isn't necessary.
    setDoc(teacherDocRef, newTeacherData)
        .catch((error: any) => {
            console.error("Failed to add teacher in background:", error);
            toast({
                variant: "destructive",
                title: "Background Registration Failed",
                description: `Could not save teacher ${details.name}. Reason: ${error.message}`,
                duration: 9000,
            });
        });

  }, [firestore, toast]);
  
  const updateTeacher = useCallback(async (teacherId: string, updates: Partial<Omit<Teacher, 'teacherId' | 'createdAt' | 'email' | 'profilePhotoUrl' | 'updatedAt'>>) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId);
    try {
      await updateDoc(teacherDocRef, { ...updates, updatedAt: serverTimestamp() });
      toast({ title: 'Teacher Updated', description: `Details for ${updates.name || teacherId} have been saved.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      throw error;
    }
  }, [firestore, toast]);
  
  const deleteTeacher = useCallback(async (teacherId: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    const teacherDocRef = doc(firestore, 'teachers', teacherId);
    try {
      await deleteDoc(teacherDocRef);
      toast({ title: 'Teacher Deleted', description: `Successfully removed teacher ${teacherId}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      throw error;
    }
  }, [firestore, toast]);

  const value = { teachers, loading, addTeacher, updateTeacher, deleteTeacher };

  return (
    <TeachersContext.Provider value={value}>
      {children}
    </TeachersContext.Provider>
  );
}
