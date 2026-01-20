
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp'> & { photoFile?: File }) => Promise<string | undefined>;
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendanceRecord: (recordId: string) => Promise<void>;
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

  const addAttendanceRecord = useCallback(async (
    record: Omit<AttendanceRecord, 'id' | 'timestamp'> & { photoFile?: File }
  ): Promise<string | undefined> => {
    if (!firestore || !firebaseApp) {
        throw new Error("Firebase is not initialized");
    }
    
    const { photoFile, ...newRecord } = record;
    const attendanceCollection = collection(firestore, 'attendance');

    let finalPhotoUrl = newRecord.photoUrl;

    if (photoFile) {
        const storage = getStorage(firebaseApp);
        const filePath = `attendance/${newRecord.date}/live_${newRecord.studentRegister}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filePath);
        
        try {
            const snapshot = await uploadBytes(storageRef, photoFile);
            finalPhotoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Attendance photo upload error:", error);
        }
    }

    try {
        const docRef = await addDoc(attendanceCollection, { 
            ...newRecord, 
            photoUrl: finalPhotoUrl,
            timestamp: serverTimestamp() 
        });
        return docRef.id;
    } catch (error) {
        console.error("Firestore write error for attendance:", error);
        throw new Error("Failed to save attendance record.");
    }
  }, [firestore, firebaseApp]);

  const updateAttendanceRecord = useCallback(async (
    recordId: string,
    updates: Partial<AttendanceRecord>
  ) => {
    if (!firestore) throw new Error("Firestore not initialized");
    const recordDocRef = doc(firestore, 'attendance', recordId);
    await updateDoc(recordDocRef, { ...updates, timestamp: serverTimestamp() });
  }, [firestore]);

  const deleteAttendanceRecord = useCallback(async (recordId: string) => {
      if (!firestore) throw new Error("Firestore not initialized");
      const recordDocRef = doc(firestore, 'attendance', recordId);
      await deleteDoc(recordDocRef);
  }, [firestore]);

  const getTodaysRecordForStudent = useCallback((studentRegister: string, date: string) => {
    return attendanceRecords.find(r => r.studentRegister === studentRegister && r.date === date);
  }, [attendanceRecords]);


  const value = { attendanceRecords, addAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord, getTodaysRecordForStudent, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
