'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl'>, photoDataUrl?: string) => void;
  deleteAttendanceRecord: (studentRegister: string, date: string) => void;
  getTodaysRecordForStudent: (studentRegister: string, date: string) => AttendanceRecord | undefined;
  loading: boolean;
}

export const AttendanceContext = createContext<AttendanceContextType | undefined>(
  undefined
);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { students, loading: studentsLoading } = useStudents();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || studentsLoading) {
      return;
    }
    
    setLoading(true);
    const attendanceCollection = collection(firestore, 'attendance');
    const unsubscribe = onSnapshot(
      attendanceCollection,
      (snapshot) => {
        const studentMap = new Map(students.map(s => [s.registerNumber, s.name]));
        const attendanceData = snapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();
          return {
            ...data,
            id: doc.id,
            studentName: data.studentName || studentMap.get(data.studentRegister) || 'Unknown Student',
            timestamp: timestamp,
          } as AttendanceRecord;
        });
        setAttendanceRecords(attendanceData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching attendance:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, students, studentsLoading]);

  const saveAttendanceRecord = useCallback((
    record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl'>,
    photoDataUrl?: string
  ) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database not available." });
      return;
    }

    const docId = `${record.date}_${record.studentRegister}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    const recordToSave: { [key: string]: any } = {
      ...record,
      timestamp: serverTimestamp(),
    };
    
    const handleFirestoreError = (error: any, path: string, operation: 'write' | 'update' | 'create', data: any) => {
      console.error(`Firestore ${operation} failed:`, error);
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData: data }));
      } else {
        toast({ variant: "destructive", title: "Database Error", description: error.message });
      }
    };
    
    if (photoDataUrl) {
      (async () => {
        try {
          const storage = getStorage(firebaseApp);
          const filePath = `students/${record.studentRegister}/attendance_${record.date}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filePath);
          const snapshot = await uploadString(storageRef, photoDataUrl, 'data_url');
          const photoUrl = await getDownloadURL(snapshot.ref);

          const finalRecord = { ...recordToSave, photoUrl };
          setDoc(recordDocRef, finalRecord, { merge: true })
            .catch(err => handleFirestoreError(err, recordDocRef.path, 'write', finalRecord));
            
        } catch (uploadError: any) {
          console.error("Firebase Storage upload failed:", uploadError);
          toast({ variant: "destructive", title: "Photo Upload Failed", description: `Could not save attendance photo. Reason: ${uploadError.message}` });
        }
      })();
    } else {
      setDoc(recordDocRef, recordToSave, { merge: true })
        .catch(err => handleFirestoreError(err, recordDocRef.path, 'write', recordToSave));
    }
  }, [firestore, firebaseApp, toast]);
  

  const deleteAttendanceRecord = useCallback((studentRegister: string, date: string) => {
      if (!firestore) {
        toast({ variant: "destructive", title: "Delete Failed", description: "Database not available." });
        return;
      }
      const docId = `${date}_${studentRegister}`;
      const recordDocRef = doc(firestore, 'attendance', docId);
      deleteDoc(recordDocRef)
        .catch((error) => {
            console.error(`Firestore delete failed:`, error);
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: recordDocRef.path, operation: 'delete' }));
            } else {
                toast({ variant: "destructive", title: "Database Error", description: error.message });
            }
        });
  }, [firestore, toast]);

  const getTodaysRecordForStudent = useCallback((studentRegister: string, date: string) => {
    return attendanceRecords.find(r => r.studentRegister === studentRegister && r.date === date);
  }, [attendanceRecords]);

  const value = { attendanceRecords, saveAttendanceRecord, deleteAttendanceRecord, getTodaysRecordForStudent, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
