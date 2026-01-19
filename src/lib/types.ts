
export interface Student {
  registerNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  department: 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';
  photoURL: string;
  email: string;
  contact: string;
  faceId?: string;
  facePhotoURLs?: string[];
  createdAt: Date;
  dateOfBirth: Date;
}

export interface AttendanceRecord {
  id: string;
  studentRegister: string;
  studentName?: string; // For easier display
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'manual' | 'unknown-face';
  markedBy: string; // admin email or 'camera'
  method: 'face-scan' | 'manual';
  timestamp: string; // Storing as ISO string for localStorage compatibility
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
  addStudent: (student: Omit<Student, 'photoURL' | 'faceId' | 'createdAt'>) => Promise<Student>;
  updateStudent: (registerNumber: string, studentUpdate: Partial<Student> & { newFacePhotos?: string[] }) => Promise<void>;
  deleteStudent: (registerNumber: string) => Promise<void>;
}
