
export interface Student {
  registerNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  department: 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';
  profilePhotoUrl: string;
  email: string;
  contact: string;
  photoHash?: string;
  createdAt: Date;
  dateOfBirth: Date;
  photoEnrolled: boolean;
  updatedAt?: Date;
}

export interface AttendanceRecord {
  id: string;
  studentRegister: string;
  studentName?: string; // For easier display
  date: string; // YYYY-MM-DD
  matched: boolean;
  timestamp: string; // Storing as ISO string for localStorage compatibility
  method: 'face-scan' | 'manual' | 'live-photo' | 'live-face';
  photoUrl?: string;
  confidence?: number;
}

export interface LiveCaptureRecord {
  id: string;
  studentRegister: string | null;
  timestamp: string;
  photoUrl: string;
  confidence: number;
  matchResult: 'success' | 'no_match' | 'already_marked' | 'error';
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
  addStudent: (studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'photoEnrolled' | 'updatedAt'> & { photoFile: File }) => Promise<void>;
  updateStudent: (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt'>> & { newPhotoFile?: File }
  ) => Promise<void>;
  deleteStudent: (registerNumber: string) => Promise<void>;
}

export interface LiveCapturesContextType {
  liveCaptures: LiveCaptureRecord[];
  loading: boolean;
}
