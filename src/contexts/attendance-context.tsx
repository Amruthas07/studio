
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
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl' | 'department' | 'studentUid' | 'subject'>, subject: string) => void;
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
    record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl' | 'department' | 'studentUid' | 'subject'>,
    subject: string
  ) => {
    if (!firestore || !user || (user.role !== 'teacher' && user.role !== 'admin')) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to mark attendance." });
      return;
    }
    
    const student = students.find(s => s.registerNumber === record.studentRegister);
    if (!student || !student.uid) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not find student to link attendance." });
        return;
    }

    const docId = `${record.date}_${record.studentRegister}_${subject}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    const dataToSave: { [key: string]: any } = {
      studentRegister: record.studentRegister,
      date: record.date,
      status: record.status,
      method: record.method,
      markedBy: user.uid, // Save teacher UID
      department: student.department,
      studentUid: student.uid,
      subject: subject,
      timestamp: serverTimestamp(),
    };
    
    // This is the critical part:
    // If a reason is provided, we are marking as 'On Leave'.
    // If no reason is provided (i.e., marking 'Present' or 'Absent'),
    // we must explicitly delete the 'reason' field from the document.
    if (record.reason) {
      dataToSave.reason = record.reason;
    } else {
      // This sentinel value ensures the 'reason' field is removed if it exists.
      dataToSave.reason = deleteField(); 
    }

    const handleFirestoreError = (error: any, path: string, operation: 'write' | 'update' | 'create', data: any) => {
      console.error(`Firestore Error (${operation}) on path '${path}':`, { error, data, userRole: user.role });
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData: data }));
      } else {
        toast({ variant: "destructive", title: "Database Error", description: error.message });
      }
    };
    
    // Use setDoc with merge: true. This acts as an "upsert":
    // it will create the document if it doesn't exist, or
    // update it if it does, applying field deletions correctly.
    setDoc(recordDocRef, dataToSave, { merge: true })
        .catch(err => handleFirestoreError(err, recordDocRef.path, 'write', dataToSave));
  }, [firestore, toast, students, user]);
  

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
