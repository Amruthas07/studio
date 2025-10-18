"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AttendanceRecord } from '@/lib/types';
import { getInitialAttendance } from '@/lib/mock-data';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: AttendanceRecord) => void;
  loading: boolean;
}

export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const initialAttendance = getInitialAttendance();
      setAttendanceRecords(initialAttendance);
    } catch (error) {
      console.error("Failed to load attendance data", error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAttendanceRecord = useCallback((newRecord: AttendanceRecord) => {
    setAttendanceRecords(prevRecords => {
      const updatedRecords = [newRecord, ...prevRecords];
      localStorage.setItem('attendance_records', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  }, []);
  
  const value = { attendanceRecords, addAttendanceRecord, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
