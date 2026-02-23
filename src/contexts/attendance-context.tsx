
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
  deleteAttendanceRecord: (studentRegister: string, date: string, subject: string) => void;
  getTodaysRecordForStudent: (studentRegister: string, date: string, subject: string) => AttendanceRecord | undefined;
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
    if (!firestore || studentsLoading || authLoading) {
      return;
    }
    
    if (!user || !user.uid) {
        setAttendanceRecords([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    let attendanceQuery;
    const baseCollection = collection(firestore, 'attendance');

    if (user.role === 'student') {
      attendanceQuery = query(baseCollection, where('studentUid', '==', user.uid));
    } else if (user.role === 'teacher' && user.department !== 'all') {
      attendanceQuery = query(baseCollection, where('department', '==', user.department));
    }
    else {
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
        console.warn("Attendance listener warning:", err.message);
        // Only emit if it's a genuine permission failure on a specific allowed path
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: 'attendance',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
        }
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
    
    if (!subject) {
        toast({ variant: "destructive", title: "Missing Data", description: "Subject must be selected to mark attendance." });
        return;
    }

    const student = students.find(s => s.registerNumber === record.studentRegister);
    if (!student || !student.uid) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not find student profile to link attendance." });
        return;
    }

    // Composite key ensures one record per student per date per subject
    const docId = `${record.date}_${record.studentRegister}_${subject.replace(/\s+/g, '_')}`;
    const recordDocRef = doc(firestore, 'attendance', docId);

    const dataToSave: { [key: string]: any } = {
      studentRegister: record.studentRegister,
      date: record.date,
      status: record.status,
      method: record.method || 'manual',
      markedBy: user.uid,
      department: student.department, // Required for security rules
      studentUid: student.uid,       // Required for security rules
      subject: subject,
      timestamp: serverTimestamp(),
    };
    
    if (record.reason) {
      dataToSave.reason = record.reason;
    } else {
      dataToSave.reason = deleteField(); 
    }

    setDoc(recordDocRef, dataToSave, { merge: true })
        .catch(async (error: any) => {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({ 
                    path: recordDocRef.path, 
                    operation: 'write', 
                    requestResourceData: dataToSave 
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: "destructive", title: "Database Error", description: error.message });
            }
        });
  }, [firestore, toast, students, user]);
  

  const deleteAttendanceRecord = useCallback((studentRegister: string, date: string, subject: string) => {
      if (!firestore) return;
      const docId = `${date}_${studentRegister}_${subject.replace(/\s+/g, '_')}`;
      const recordDocRef = doc(firestore, 'attendance', docId);
      deleteDoc(recordDocRef)
        .catch((error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: recordDocRef.path, operation: 'delete' }));
            }
        });
  }, [firestore]);

  const getTodaysRecordForStudent = useCallback((studentRegister: string, date: string, subject: string) => {
    return attendanceRecords.find(r => r.studentRegister === studentRegister && r.date === date && r.subject === subject);
  }, [attendanceRecords]);

  const value = { attendanceRecords, saveAttendanceRecord, deleteAttendanceRecord, getTodaysRecordForStudent, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
