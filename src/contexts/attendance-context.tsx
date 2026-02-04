'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, where, deleteField } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useAuth } from '@/hooks/use-auth';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl' | 'department' | 'studentUid'>) => void;
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
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for all dependencies to be ready
    if (!firestore || studentsLoading || authLoading) {
      return;
    }
    
    // If auth is done and there's no user, clear data and stop loading.
    if (!user || !user.uid) {
        setAttendanceRecords([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    let attendanceQuery;
    const baseCollection = collection(firestore, 'attendance');

    if (user.role === 'student') {
      // Students should only query for their own records using their secure UID.
      attendanceQuery = query(baseCollection, where('studentUid', '==', user.uid));
    } else if (user.role === 'teacher' && user.department !== 'all') {
      // Teachers query for records in their department
      attendanceQuery = query(baseCollection, where('department', '==', user.department));
    }
    else {
      // Admins and 'all' department teachers get all records.
      attendanceQuery = baseCollection;
    }

    const unsubscribe = onSnapshot(
      attendanceQuery,
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
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: (attendanceQuery as any)._query?.path?.canonicalString() || 'attendance',
          operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, students, studentsLoading, user, authLoading]);

  const saveAttendanceRecord = useCallback((
    record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl' | 'department' | 'studentUid'>
  ) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database not available." });
      return;
    }
    
    const student = students.find(s => s.registerNumber === record.studentRegister);
    if (!student || !student.uid) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not find student to link attendance." });
        return;
    }

    const docId = `${record.date}_${record.studentRegister}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    // Use a generic object type to allow for `deleteField()`
    const dataToSave: { [key: string]: any } = {
      studentRegister: record.studentRegister,
      date: record.date,
      status: record.status,
      method: record.method,
      markedBy: record.markedBy,
      department: student.department,
      studentUid: student.uid,
      timestamp: serverTimestamp(),
    };
    
    // Explicitly handle the 'reason' field to ensure it is removed when not needed.
    if (record.reason) {
      dataToSave.reason = record.reason; // Add reason if it exists (for 'On Leave')
    } else {
      dataToSave.reason = deleteField(); // Remove reason field for 'Present' or 'Absent'
    }

    const handleFirestoreError = (error: any, path: string, operation: 'write' | 'update' | 'create', data: any) => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData: data }));
      } else {
        toast({ variant: "destructive", title: "Database Error", description: error.message });
      }
    };
    
    // Use setDoc with merge: true to create or update. This will correctly add, update, or remove the 'reason' field.
    setDoc(recordDocRef, dataToSave, { merge: true })
        .catch(err => handleFirestoreError(err, recordDocRef.path, 'write', dataToSave));
  }, [firestore, toast, students]);
  

  const deleteAttendanceRecord = useCallback((studentRegister: string, date: string) => {
      if (!firestore) {
        toast({ variant: "destructive", title: "Delete Failed", description: "Database not available." });
        return;
      }
      const docId = `${date}_${studentRegister}`;
      const recordDocRef = doc(firestore, 'attendance', docId);
      deleteDoc(recordDocRef)
        .catch((error) => {
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
