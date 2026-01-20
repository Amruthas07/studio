
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

type Status = 'idle' | 'capturing' | 'processing' | 'success' | 'no_match' | 'already_marked' | 'error';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp'> & { photoFile?: File }) => Promise<void>;
  loading: boolean;
  logLiveCapture: (data: {
    photoFile: File;
    status: Status;
    confidence?: number;
    studentRegister?: string;
  }) => void;
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
  ) => {
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
            console.log(`Uploading attendance photo to: ${filePath}`);
            const snapshot = await uploadBytes(storageRef, photoFile);
            finalPhotoUrl = await getDownloadURL(snapshot.ref);
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
            photoUrl: finalPhotoUrl,
            timestamp: serverTimestamp() 
        });
    } catch (error) {
        console.error("Firestore write error for attendance:", error);
        throw new Error("Failed to save attendance record.");
    }
  }, [firestore, firebaseApp]);

  const logLiveCapture = useCallback(async (data: {
    photoFile: File;
    status: Status;
    confidence?: number;
    studentRegister?: string;
  }) => {
      if (!firestore || !firebaseApp) {
          console.warn("logLiveCapture: Firebase not initialized.");
          return;
      }
      const { photoFile, status, confidence, studentRegister } = data;

      const storage = getStorage(firebaseApp);
      const date = new Date().toISOString().split('T')[0];
      const filePath = `live_captures/${date}/${crypto.randomUUID()}.jpg`;
      const storageRef = ref(storage, filePath);

      try {
          const snapshot = await uploadBytes(storageRef, photoFile);
          const photoUrl = await getDownloadURL(snapshot.ref);

          const logCollection = collection(firestore, 'liveCaptures');
          await addDoc(logCollection, {
              studentRegister: studentRegister || null,
              timestamp: serverTimestamp(),
              photoUrl: photoUrl,
              confidence: confidence || 0,
              matchResult: status,
          });
          console.log("Live capture logged successfully.");
      } catch (error) {
          console.error("Failed to log live capture:", error);
          // Don't bother the user with a toast for a background logging failure.
      }
  }, [firestore, firebaseApp]);

  const value = { attendanceRecords, addAttendanceRecord, loading, logLiveCapture };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
