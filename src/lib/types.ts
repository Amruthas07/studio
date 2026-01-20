
export interface Student {
  registerNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  department: 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';
  photoURL: string;
  email: string;
  contact: string;
  photoHash?: string;
  createdAt: Date;
  dateOfBirth: Date;
  photoEnrolled?: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentRegister: string;
  studentName?: string; // For easier display
  date: string; // YYYY-MM-DD
  matched: boolean;
  timestamp: string; // Storing as ISO string for localStorage compatibility
  method: 'face-scan' | 'manual';
  photoUrl?: string;
}

export interface RecentExport {
  fileName: string;
  generatedAt: Date;
  url: string;
  department: string;
}

export interface StudentsContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  loading: boolean;
  addStudent: (student: Omit<Student, 'photoURL' | 'photoHash' | 'createdAt' | 'photoEnrolled'> & { photoFile: File }) => Promise<Student>;
  updateStudent: (
    registerNumber: string,
    studentUpdate: Partial<Student> & { newPhotoFile?: File }
  ) => Promise<void>;
  deleteStudent: (registerNumber: string) => Promise<void>;
}
