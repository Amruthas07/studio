
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, deleteField } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AttendanceRecord } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import { useFirestore, useFirebaseApp } from '@/hooks/use-firebase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp'> & { photoFile?: File }) => Promise<string | undefined>;
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord> & { photoFile?: File }) => Promise<void>;
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
    
    const recordForFirestore: { [key: string]: any } = { ...record };
    const photoFile = recordForFirestore.photoFile;

    // Explicitly delete the File object and any undefined reason before sending to Firestore.
    delete recordForFirestore.photoFile;
    if (typeof recordForFirestore.reason !== 'string' || recordForFirestore.reason.trim().length === 0) {
        delete recordForFirestore.reason;
    }

    if (photoFile) {
        const storage = getStorage(firebaseApp);
        const filePath = `attendance/${recordForFirestore.date}/live_${recordForFirestore.studentRegister}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filePath);
        
        try {
            const snapshot = await uploadBytes(storageRef, photoFile);
            recordForFirestore.photoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Attendance photo upload error:", error);
        }
    }

    try {
        const attendanceCollection = collection(firestore, 'attendance');
        const docRef = await addDoc(attendanceCollection, { 
            ...recordForFirestore, 
            timestamp: serverTimestamp() 
        });
        return docRef.id;
    } catch (error) {
        console.error("Firestore write error for attendance:", error);
        throw new Error("Failed to save attendance record. The data might be invalid.");
    }
  }, [firestore, firebaseApp]);

  const updateAttendanceRecord = useCallback(async (
    recordId: string,
    updates: Partial<AttendanceRecord> & { photoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) throw new Error("Firestore not initialized");

    const recordDocRef = doc(firestore, 'attendance', recordId);
    
    const updatesForFirestore: { [key: string]: any } = { ...updates };
    const photoFile = updatesForFirestore.photoFile;
    
    // Explicitly delete the file object before sending to Firestore
    delete updatesForFirestore.photoFile;

    // Handle the 'reason' field explicitly to avoid 'undefined' errors or to remove it.
    if ('reason' in updatesForFirestore) {
        if (typeof updatesForFirestore.reason === 'string' && updatesForFirestore.reason.trim().length > 0) {
            // Reason is valid, keep it.
        } else {
            // Reason is empty, null, or undefined. Remove it from the database.
            updatesForFirestore.reason = deleteField();
        }
    } else {
        // If status is being set to 'present' or 'absent', ensure reason is removed.
        if (updates.status && updates.status !== 'on_leave') {
            updatesForFirestore.reason = deleteField();
        }
    }


    if (photoFile) {
        const storage = getStorage(firebaseApp);
        const filePath = `attendance/${updates.date || new Date().toISOString().split('T')[0]}/live_${updates.studentRegister || 'unknown'}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filePath);
        
        try {
            const snapshot = await uploadBytes(storageRef, photoFile);
            updatesForFirestore.photoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Attendance photo upload error on update:", error);
        }
    }

    try {
      await updateDoc(recordDocRef, { ...updatesForFirestore, timestamp: serverTimestamp() });
    } catch(error) {
       console.error("Firestore update error for attendance:", error);
       throw new Error("Failed to update attendance record.");
    }
  }, [firestore, firebaseApp]);

  const deleteAttendanceRecord = useCallback(async (recordId: string) => {
      if (!firestore) throw new Error("Firestore not initialized");
      const recordDocRef = doc(firestore, 'attendance', recordId);
      await deleteDoc(recordDocRef);
  }, [firestore]);

  const getTodaysRecordForStudent = useCallback((studentRegister: string, date: string) => {
    // Find the most recent record for that student on that day
    const records = attendanceRecords
      .filter(r => r.studentRegister === studentRegister && r.date === date)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return records[0] || undefined;
  }, [attendanceRecords]);


  const value = { attendanceRecords, addAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord, getTodaysRecordForStudent, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
