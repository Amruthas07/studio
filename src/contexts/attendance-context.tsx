
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
  saveAttendanceRecord: (record: Partial<Omit<AttendanceRecord, 'id'>> & { studentRegister: string, date: string }, photoFile?: File) => Promise<void>;
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
    record: Partial<Omit<AttendanceRecord, 'id'>> & { studentRegister: string, date: string },
    photoFile?: File
  ) => {
    if (!firestore || !firebaseApp) throw new Error("Firebase not initialized");
    
    const docId = `${record.date}_${record.studentRegister}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    // The `record` object is now always correctly formatted by `handleAction`.
    const recordForFirestore: { [key: string]: any } = { 
      ...record,
      timestamp: serverTimestamp()
    };

    // Handle photo upload and get URL, adding it to the document
    if (photoFile) {
        const storage = getStorage(firebaseApp);
        const filePath = `attendance/${record.date}/live_${record.studentRegister}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filePath);
        try {
            const snapshot = await uploadBytes(storageRef, photoFile);
            recordForFirestore.photoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Attendance photo upload error:", error);
            throw new Error("Failed to upload attendance photo.");
        }
    }
    
    try {
        // Use setDoc with merge:true to create or update the record.
        await setDoc(recordDocRef, recordForFirestore, { merge: true });
    } catch(error) {
       console.error("Firestore save error for attendance:", error);
       throw new Error("Failed to save attendance record.");
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
