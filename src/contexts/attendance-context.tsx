
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: AttendanceRecord) => void;
  loading: boolean;
}

export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { students, loading: studentsLoading } = useStudents();

  useEffect(() => {
    if (studentsLoading) {
      return; 
    }
    // In a real Firestore implementation, you would set up a listener here.
    // For now, we'll start with an empty list.
    setAttendanceRecords([]);
    setLoading(false);
  }, [students, studentsLoading]);

  const addAttendanceRecord = useCallback((newRecord: AttendanceRecord) => {
    setAttendanceRecords(prevRecords => [newRecord, ...prevRecords]);
    // Firestore logic to add a document would go here.
  }, []);
  
  const value = { attendanceRecords, addAttendanceRecord, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
