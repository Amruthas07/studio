
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl'>, photoFile?: File) => Promise<void>;
  deleteAttendanceRecord: (studentRegister: string, date: string) => Promise<void>;
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

  const saveAttendanceRecord = useCallback(async (
    record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl'>,
    photoFile?: File
  ) => {
    if (!firestore || !firebaseApp) throw new Error("Firebase not initialized.");

    const docId = `${record.date}_${record.studentRegister}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    const recordToSave: { [key: string]: any } = {
      ...record,
      timestamp: serverTimestamp(),
    };

    if (photoFile) {
      const storage = getStorage(firebaseApp);
      const filePath = `attendance/${record.date}/live_${record.studentRegister}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filePath);
      try {
        const snapshot = await uploadBytes(storageRef, photoFile);
        recordToSave.photoUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadError: any) {
        console.error("Firebase Storage upload failed:", uploadError);
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }
    }

    try {
      await setDoc(recordDocRef, recordToSave, { merge: true });
    } catch (firestoreError: any) {
      console.error("Firestore setDoc failed:", firestoreError);
      throw new Error(`Database update failed: ${firestoreError.message}`);
    }
  }, [firestore, firebaseApp]);
  

  const deleteAttendanceRecord = useCallback(async (studentRegister: string, date: string) => {
      if (!firestore) throw new Error("Firestore not initialized");
      const docId = `${date}_${studentRegister}`;
      const recordDocRef = doc(firestore, 'attendance', docId);
      await deleteDoc(recordDocRef);
  }, [firestore]);

  const getTodaysRecordForStudent = useCallback((studentRegister: string, date: string) => {
    const docId = `${date}_${studentRegister}`;
    return attendanceRecords.find(r => r.id === docId);
  }, [attendanceRecords]);


  const value = { attendanceRecords, saveAttendanceRecord, deleteAttendanceRecord, getTodaysRecordForStudent, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

    