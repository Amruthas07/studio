
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
    return new Promise<void>(async (resolve, reject) => {
        if (!firestore || !firebaseApp) {
            return reject(new Error("Firebase is not initialized"));
        }
        
        const { photoFile, ...newRecord } = record;
        const attendanceCollection = collection(firestore, 'attendance');

        if (photoFile && newRecord.method === 'face-scan') {
            const storage = getStorage(firebaseApp);
            const filePath = `attendance/${newRecord.date}/${newRecord.studentRegister}_${Date.now()}.jpg`;
            const storageRef = ref(storage, filePath);
            
            const uploadTask = uploadBytesResumable(storageRef, photoFile);
            
            uploadTask.on('state_changed',
                null, // No progress reporting needed for now
                (error) => {
                    console.error("Attendance photo upload error:", error);
                    reject(new Error("Photo upload failed for attendance."));
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        await addDoc(attendanceCollection, { 
                            ...newRecord, 
                            photoUrl: downloadURL,
                            timestamp: serverTimestamp() 
                        });
                        resolve();
                    } catch (error) {
                        console.error("Firestore write error after upload:", error);
                        reject(new Error("Failed to save attendance record after photo upload."));
                    }
                }
            );

        } else {
            try {
                await addDoc(attendanceCollection, { ...newRecord, timestamp: serverTimestamp() });
                resolve();
            } catch (error) {
                console.error("Firestore write error:", error);
                reject(new Error("Failed to save attendance record."));
            }
        }
    });
  }, [firestore, firebaseApp]);

  const value = { attendanceRecords, addAttendanceRecord, loading };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
