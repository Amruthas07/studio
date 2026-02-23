'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, updateDoc, serverTimestamp, limit, writeBatch } from 'firebase/firestore';
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
        () => setLoading(false)
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
        () => setLoading(false)
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
        if (students.some(s => s.registerNumber === studentData.registerNumber)) {
            return { success: false, error: 'Register number already exists.' };
        }

        const storage = getStorage(firebaseApp);
        const photoRef = ref(storage, `students/${studentData.registerNumber}/profile.jpg`);

        // HIGH-SPEED PARALLEL PIPELINE: Auth and Image processing run concurrently
        const [userCredential, photoUrl] = await Promise.all([
            // Task 1: Create Auth Account (Password = Register Number)
            (async () => {
                const tempAppName = `enroll-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                tempApp = initializeApp(firebaseConfig, tempAppName);
                const tAuth = getAuth(tempApp);
                return await createUserWithEmailAndPassword(tAuth, studentData.email, studentData.registerNumber);
            })(),
            // Task 2: Local Resize & Storage Upload
            (async () => {
                if (!photoFile) return '';
                const optimized = await resizeAndCompressImage(photoFile, 400, 0.7);
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
        console.error("Enrollment Exception:", error);
        let message = error.message || 'Enrollment failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') message = 'This email is already in use.';
        if (error.code === 'auth/weak-password') message = 'Register number must be at least 6 characters.';
        return { success: false, error: message };
    } finally {
        if (tempApp) deleteApp(tempApp).catch(() => {});
    }
  }, [firestore, firebaseApp, students]);

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
            const processed = await resizeAndCompressImage(newPhotoFile, 400, 0.7);
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
            await uploadBytes(photoRef, processed);
            updates.profilePhotoUrl = await getDownloadURL(photoRef);
        }
        await updateDoc(studentDocRef, updates);
        toast({ title: "Profile Updated", description: "Changes saved successfully." });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Update Error", description: e.message });
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
    if (!firestore || !firebaseApp) return;
    const student = students.find(s => s.registerNumber === registerNumber);
    if (!student) return;

    deleteDoc(doc(firestore, 'students', registerNumber))
      .then(() => {
        toast({ title: "Student Removed", description: "Record deleted successfully." });
        if (student.profilePhotoUrl) {
            const storage = getStorage(firebaseApp);
            deleteObject(ref(storage, `students/${registerNumber}/profile.jpg`)).catch(() => {});
        }
      });
  }, [firestore, firebaseApp, toast, students]);

  const promoteStudents = useCallback(async (department: string): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!firestore) return { success: false, count: 0, error: 'Database not ready' };
    
    try {
        const studentsToPromote = department === 'all' 
            ? students 
            : students.filter(s => s.department === department);
        
        if (studentsToPromote.length === 0) {
            return { success: true, count: 0 };
        }

        const batch = writeBatch(firestore);
        let count = 0;

        studentsToPromote.forEach(student => {
            if (student.semester < 8) {
                const studentRef = doc(firestore, 'students', student.registerNumber);
                batch.update(studentRef, { 
                    semester: student.semester + 1,
                    updatedAt: serverTimestamp()
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            toast({ title: "Promotion Successful", description: `${count} students moved to the next semester.` });
        } else {
            toast({ title: "No Action Taken", description: "All students are already in the final semester." });
        }
        
        return { success: true, count };
    } catch (error: any) {
        console.error("Promotion failed:", error);
        return { success: false, count: 0, error: error.message };
    }
  }, [firestore, students, toast]);

  return (
    <StudentsContext.Provider value={{ students, loading, addStudent, updateStudent, deleteStudent, promoteStudents, setStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}
