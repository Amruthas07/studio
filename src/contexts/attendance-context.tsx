
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore } from '@/hooks/use-firebase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'studentName'>) => Promise<void>;
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
          return {
            ...data,
            id: doc.id,
            studentName: studentMap.get(data.studentRegister) || 'Unknown Student',
            timestamp: data.timestamp, // ensure timestamp is a string
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

  const addAttendanceRecord = useCallback(async (newRecord: Omit<AttendanceRecord, 'id' | 'studentName'>) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    const attendanceCollection = collection(firestore, 'attendance');
    
    // No await here. The onSnapshot listener will update the state automatically.
    addDoc(attendanceCollection, newRecord).catch(error => {
        console.error("Failed to add attendance record to Firestore:", error);
        // If it fails, the UI won't have an optimistic update, but the listener keeps it consistent
    });
  }, [firestore]);

  const value = { attendanceRecords, addAttendanceRecord, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
