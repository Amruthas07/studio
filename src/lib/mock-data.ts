
import type { Student, AttendanceRecord } from './types';

// This function is now set to return an empty array, so no mock students are created.
const generateStudents = (): Student[] => {
    return [];
}

export const getInitialStudents = (): Student[] => {
    if (typeof window === 'undefined') return [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents);
        // Quick validation to ensure it's an array
        if (Array.isArray(parsed)) {
          // Check if it's the old, non-empty mock data and clear it if so.
          if (parsed.length > 0 && !localStorage.getItem('mock_data_cleared')) {
              localStorage.setItem('mock_data_cleared', 'true');
              localStorage.removeItem('attendance_records'); // Clear old attendance too
              const emptyStudents: Student[] = [];
              localStorage.setItem('students', JSON.stringify(emptyStudents));
              return emptyStudents;
          }
          return parsed.map(p => ({...p, createdAt: new Date(p.createdAt), dateOfBirth: new Date(p.dateOfBirth)}));
        }
      } catch (e) {
        console.error("Failed to parse students from localStorage", e);
      }
    }
    const generatedStudents = generateStudents();
    localStorage.setItem('students', JSON.stringify(generatedStudents));
    return generatedStudents;
}

// This function is now set to return an empty array, so no mock attendance is created.
const generateAttendance = (students: Student[]): AttendanceRecord[] => {
    return [];
}

export const getInitialAttendance = (students: Student[]): AttendanceRecord[] => {
    if (typeof window === 'undefined') return [];
    
    const storedAttendance = localStorage.getItem('attendance_records');
    if (storedAttendance) {
        try {
            const parsed = JSON.parse(storedAttendance);
            if(Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error("Failed to parse attendance from localStorage", e);
        }
    }
    
    const initialAttendance = generateAttendance(students);
    localStorage.setItem('attendance_records', JSON.stringify(initialAttendance));
    return initialAttendance;
}
