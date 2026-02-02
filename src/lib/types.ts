
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
  updatedAt?: Date;
}

export interface AttendanceRecord {
  id: string;
  studentRegister: string;
  studentName?: string; // For easier display
  date: string; // YYYY-MM-DD
  department: 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';
  status: 'present' | 'absent';
  timestamp: string; // Storing as ISO string for localStorage compatibility
  method: 'face-scan' | 'manual' | 'live-photo';
  photoUrl?: string;
  reason?: string;
}

export interface Teacher {
  teacherId: string;
  name: string;
  department: 'cs' | 'ce' | 'me' | 'ee' | 'mce' | 'ec';
  profilePhotoUrl: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RecentExport {
  fileName: string;
  generatedAt: Date;
  url: string;
  department: string;
  type: 'student' | 'teacher';
}

export interface StudentsContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  loading: boolean;
  addStudent: (studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt'> & { photoFile: File }) => Promise<void>;
  updateStudent: (
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ) => void;
  deleteStudent: (registerNumber: string) => void;
}

export interface TeachersContextType {
  teachers: Teacher[];
  loading: boolean;
  addTeacher: (teacherData: Omit<Teacher, 'teacherId' | 'createdAt' | 'updatedAt' | 'profilePhotoUrl'> & { password: string }) => Promise<void>;
  updateTeacher: (teacherId: string, teacherUpdate: Partial<Omit<Teacher, 'teacherId' | 'createdAt' | 'email' | 'profilePhotoUrl' | 'updatedAt'>>) => void;
  deleteTeacher: (teacherId: string) => void;
}


export interface LiveCaptureRecord {
  id: string;
  photoUrl: string;
  result: 'matched' | 'unmatched' | 'multiple';
  confidence?: number;
  matchedStudentId?: string;
  matchedStudentName?: string;
  timestamp: Date;
}

export interface InstitutionProfile {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  coverImageUrl?: string;
}

export interface InstitutionProfileContextType {
  institutionProfile: InstitutionProfile | null;
  loading: boolean;
  updateInstitutionProfile: (data: Partial<Omit<InstitutionProfile, 'id'>>) => void;
}
