
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, updateDoc, serverTimestamp, limit, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
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
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
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

  /**
   * Helper function to check if a student is at least 16 years old.
   */
  const validateAge = (dob: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 >= 16;
    }
    return age >= 16;
  };

  const addStudent = useCallback(async (
    studentData: Omit<Student, 'createdAt' | 'updatedAt' | 'uid'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firestore) return { success: false, error: 'Database not ready' };

    // 1. Validation Logic: Prevent adding if age < 16
    if (!validateAge(studentData.dateOfBirth)) {
      return { success: false, error: 'Eligibility Denied: Student must be at least 16 years old for enrollment.' };
    }

    // 2. Validation Logic: Register number length
    if (studentData.registerNumber.length !== 10) {
      return { success: false, error: 'Invalid Format: Register number must be exactly 10 characters.' };
    }

    let tempApp: any = null;
    try {
        if (students.some(s => s.registerNumber === studentData.registerNumber)) {
            return { success: false, error: 'Record Exists: This register number is already assigned.' };
        }

        const tempAppName = `enroll-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tAuth = getAuth(tempApp);
        
        const userCredential = await createUserWithEmailAndPassword(tAuth, studentData.email, studentData.registerNumber);

        const uid = userCredential.user.uid;
        const studentDocRef = doc(firestore, 'students', studentData.registerNumber);
        
        await setDoc(studentDocRef, {
            ...studentData,
            uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error: any) {
        let message = error.message || 'Enrollment failed.';
        if (error.code === 'auth/email-already-in-use') message = 'Enrollment failed: This email is already registered.';
        if (error.code === 'permission-denied') message = 'Permission Denied: You do not have authorization to enroll students or the student is under 16.';
        return { success: false, error: message };
    } finally {
        if (tempApp) deleteApp(tempApp).catch(() => {});
    }
  }, [firestore, students]);

  const updateStudent = useCallback(async (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    if (!firestore) return;

    if (studentUpdate.dateOfBirth && !validateAge(studentUpdate.dateOfBirth)) {
       toast({ variant: "destructive", title: "Update Failed", description: "Age eligibility mismatch: Student must be 16 or older." });
       return;
    }

    const studentDocRef = doc(firestore, 'students', registerNumber);
    try {
        await updateDoc(studentDocRef, { ...studentUpdate, updatedAt: serverTimestamp() });
        toast({ title: "Profile Updated", description: "Changes saved successfully." });
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            toast({ variant: "destructive", title: "Update Refused", description: "Database rules prevented this update. Ensure age is 16+." });
        } else {
            toast({ variant: "destructive", title: "Update Error", description: e.message });
        }
    }
  }, [firestore, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'students', registerNumber))
      .then(() => {
        toast({ title: "Student Removed", description: "Record deleted successfully." });
      })
      .catch((e: any) => {
          const message = e.code === 'permission-denied' 
            ? "Access Denied: Only administrators can remove records." 
            : (e.message || "An unexpected error occurred during removal.");
          
          toast({ 
            variant: "destructive", 
            title: "Delete Failed", 
            description: message 
          });
      });
  }, [firestore, toast]);

  const promoteStudents = useCallback(async (department: string): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!firestore) return { success: false, count: 0, error: 'Database not ready' };
    try {
        const studentsToPromote = department === 'all' ? students : students.filter(s => s.department === department);
        if (studentsToPromote.length === 0) return { success: true, count: 0 };
        const batch = writeBatch(firestore);
        let count = 0;
        studentsToPromote.forEach(student => {
            if (student.semester < 6) {
                const studentRef = doc(firestore, 'students', student.registerNumber);
                batch.update(studentRef, { semester: student.semester + 1, updatedAt: serverTimestamp() });
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
            toast({ title: "Promotion Successful", description: `${count} students moved to next semester.` });
        }
        return { success: true, count };
    } catch (error: any) {
        return { success: false, count: 0, error: error.message };
    }
  }, [firestore, students, toast]);

  return (
    <StudentsContext.Provider value={{ students, loading, addStudent, updateStudent, deleteStudent, promoteStudents, setStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}
