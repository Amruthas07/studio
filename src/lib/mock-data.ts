import type { Student, AttendanceRecord } from './types';

// Let's create mock data for 5 students in each department
const departments: ('cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec')[] = ["cs", "ce", "me", "ee", "mce", "ec"];
const firstNames = ["Amrutha", "Akshatha", "Divya", "Bhavana", "Chandana"];
const lastNames = ["R", "S", "K", "M", "P"];

const generateStudents = (): Student[] => {
    const students: Student[] = [];
    let studentCount = 1;
    departments.forEach(dept => {
        for (let i = 0; i < 5; i++) {
            const registerNumber = `324${dept}21${String(studentCount).padStart(3, '0')}`;
            const name = `${firstNames[i]} ${lastNames[i]}`;
            students.push({
                registerNumber,
                name: name,
                fatherName: `Father of ${name}`,
                motherName: `Mother of ${name}`,
                department: dept,
                photoURL: `https://picsum.photos/seed/${registerNumber}/200/200`,
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                contact: `9876543${String(studentCount).padStart(3, '0')}`,
                createdAt: new Date(new Date().setDate(new Date().getDate() - (studentCount * 5))),
                dateOfBirth: new Date(2004, i, studentCount),
                faceId: `face_${registerNumber}`
            });
            studentCount++;
        }
    });
    return students;
}

export const getInitialStudents = (): Student[] => {
    if (typeof window === 'undefined') return [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents);
        // Quick validation to ensure it's an array
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // If parsing fails, fall back to generating
        console.error("Failed to parse students from localStorage", e);
      }
    }
    const generatedStudents = generateStudents();
    localStorage.setItem('students', JSON.stringify(generatedStudents));
    return generatedStudents;
}


const generateAttendance = (students: Student[]): AttendanceRecord[] => {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    let recordId = 1;

    students.forEach(student => {
        // Clear records for CS department
        if (student.department === 'cs') {
            return;
        }
        // Generate records for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            // Decide status randomly, but make 'present' more likely
            const randomStatus = Math.random();
            let status: AttendanceRecord['status'] = 'present';
            if (randomStatus < 0.1) status = 'absent';
            else if (randomStatus < 0.2) status = 'late';

             // Don't create absent records for today to make dashboard look better
            if (i === 0 && status === 'absent') {
                status = 'present';
            }

            if (status !== 'absent') {
                 records.push({
                    id: String(recordId++),
                    studentRegister: student.registerNumber,
                    studentName: student.name,
                    date: dateString,
                    status: status,
                    markedBy: 'camera',
                    method: 'face-scan',
                    timestamp: new Date(date.setHours(9, Math.floor(Math.random() * 59))).toISOString(),
                });
            } else {
                 // For absent, we might not have a record, or have one marked manually
                 // Let's add a manual absent record for some
                 if(Math.random() < 0.5) {
                    records.push({
                        id: String(recordId++),
                        studentRegister: student.registerNumber,
                        studentName: student.name,
                        date: dateString,
                        status: 'absent',
                        markedBy: 'jsspn324@gmail.com',
                        method: 'manual',
                        timestamp: new Date(date.setHours(16, 0)).toISOString(),
                    });
                 }
            }
        }
    })
    return records;
}

export const getInitialAttendance = (): AttendanceRecord[] => {
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
    
    const studentsToUse = getInitialStudents();

    const initialAttendance = generateAttendance(studentsToUse);
    localStorage.setItem('attendance_records', JSON.stringify(initialAttendance));
    return initialAttendance;
}
