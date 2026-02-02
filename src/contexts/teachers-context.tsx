'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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

  const addTeacher = useCallback(async (teacherData: Omit<Teacher, 'teacherId' | 'createdAt' | 'profilePhotoUrl'> & { password: string }) => {
    if (!firestore) {
        throw new Error('Database not initialized.');
    }

    const { email, password, ...details } = teacherData;

    const existingTeacherQuery = query(collection(firestore, "teachers"), where("email", "==", email));
    const querySnapshot = await getDocs(existingTeacherQuery);
    if (!querySnapshot.empty) {
        throw new Error(`A teacher with email ${email} already exists.`);
    }

    const teacherDocRef = doc(firestore, 'teachers', email); // Use email as ID

    const newTeacherData = {
        ...details,
        email,
        password, // Storing plaintext password as per existing app logic
        teacherId: email,
        profilePhotoUrl: "", // Set to empty string so initials show up
        createdAt: serverTimestamp(),
    };

    await setDoc(teacherDocRef, newTeacherData);

  }, [firestore]);

  const value = { teachers, loading, addTeacher };

  return (
    <TeachersContext.Provider value={value}>
      {children}
    </TeachersContext.Provider>
  );
}
