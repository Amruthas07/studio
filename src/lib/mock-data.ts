
import type { Student, AttendanceRecord } from './types';

// This function is now set to return an empty array, as data will be managed by Firestore.
export const getInitialStudents = (): Student[] => {
    return [];
}

// This function is now set to return an empty array, as data will be managed by Firestore.
export const getInitialAttendance = (): AttendanceRecord[] => {
    return [];
}
