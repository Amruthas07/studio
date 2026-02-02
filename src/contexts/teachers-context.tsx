
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useAuth as useFirebaseAuth } from '@/hooks/use-firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { Teacher, TeachersContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
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
    if (!firestore || !auth) {
        throw new Error('Database or Auth not initialized.');
    }

    const { email, password, ...details } = teacherData;

    const q = query(collection(firestore, "teachers"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
        throw new Error(`A teacher with email ${email} already exists.`);
    }

    (async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);

            const teacherDocRef = doc(firestore, 'teachers', email);
            const newTeacherData = {
                ...details,
                email,
                teacherId: email,
                profilePhotoUrl: "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await setDoc(teacherDocRef, newTeacherData);
            
            toast({ title: 'Teacher Registered', description: `${details.name} can now log in.`});

        } catch (error: any) {
            let message = error.message;
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already in use by another authentication account.';
            }
            if (error.code === 'auth/weak-password') {
                message = 'Password must be at least 6 characters.';
            }
            toast({
                variant: "destructive",
                title: "Background Registration Failed",
                description: message,
                duration: 9000,
            });
        }
    })();
  }, [firestore, auth, toast]);
  
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
    // Note: This does not delete the Firebase Auth user, only the Firestore data.
    // Deleting auth users is a sensitive operation not suitable for the client-side.
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
