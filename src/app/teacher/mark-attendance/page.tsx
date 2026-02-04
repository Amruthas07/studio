
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { MarkAttendanceStudentList } from '@/components/teacher/mark-attendance-student-list';

export default function MarkAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, loading: attendanceLoading, saveAttendanceRecord, getTodaysRecordForStudent } = useAttendance();

  const [searchTerm, setSearchTerm] = React.useState('');

  const loading = authLoading || studentsLoading || attendanceLoading;

  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const departmentStudents = React.useMemo(() => {
    if (!user?.department || user.department === 'all') return [];
    
    const filtered = students.filter(student => student.department === user.department);

    if (!searchTerm) return filtered;

    return filtered.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, user, searchTerm]);

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleMarkAttendance = (studentRegister: string, status: 'present' | 'absent', reason?: string) => {
    saveAttendanceRecord({
        studentRegister,
        date: today,
        status,
        reason,
        method: 'manual',
        markedBy: user.email,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Mark Daily Attendance
        </h1>
        <p className="text-foreground">
          For department: <span className="font-bold uppercase">{user.department}</span> | Date: <span className="font-bold">{format(new Date(), 'PPP')}</span>
        </p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name or register number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Mark attendance for each student for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <MarkAttendanceStudentList 
            students={departmentStudents}
            getTodaysRecordForStudent={getTodaysRecordForStudent}
            onMarkAttendance={handleMarkAttendance}
            today={today}
          />
        </CardContent>
      </Card>
    </div>
  );
}
