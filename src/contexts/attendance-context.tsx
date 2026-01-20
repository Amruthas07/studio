
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'studentName' | 'timestamp' | 'photoUrl'> & { photoFile?: File }) => Promise<void>;
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
      // Don't fetch attendance until firestore is ready and students are loaded
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
            studentName: studentMap.get(data.studentRegister) || 'Unknown Student',
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
    record: Omit<AttendanceRecord, 'id' | 'studentName' | 'timestamp' | 'photoUrl'> & { photoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) {
        throw new Error("Firebase is not initialized");
    }
    
    const { photoFile, ...newRecord } = record;
    const attendanceCollection = collection(firestore, 'attendance');

    let photoUrl: string | undefined = undefined;

    if (photoFile) {
        const storage = getStorage(firebaseApp);
        const filePath = `attendance/${newRecord.date}/live_${newRecord.studentRegister}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filePath);
        
        try {
            console.log(`Uploading attendance photo to: ${filePath}`);
            const snapshot = await uploadBytes(storageRef, photoFile);
            photoUrl = await getDownloadURL(snapshot.ref);
            console.log("Attendance photo uploaded successfully.");
        } catch (error) {
            console.error("Attendance photo upload error:", error);
            // We can choose to still mark attendance even if photo upload fails
            // Or throw an error to indicate failure. For now, we'll log and continue.
        }
    }

    try {
        await addDoc(attendanceCollection, { 
            ...newRecord, 
            photoUrl,
            timestamp: serverTimestamp() 
        });
    } catch (error) {
        console.error("Firestore write error for attendance:", error);
        throw new Error("Failed to save attendance record.");
    }
  }, [firestore, firebaseApp]);

  const value = { attendanceRecords, addAttendanceRecord, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
