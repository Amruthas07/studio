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
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  studentRegister: string;
  studentName?: string; // For easier display
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'manual' | 'unknown-face';
  markedBy: string; // admin email or 'camera'
  method: 'face-scan' | 'manual';
  timestamp: Date;
}

export interface RecentExport {
  fileName: string;
  generatedAt: Date;
  url: string;
  department: string;
}
