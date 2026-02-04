'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';
import { Loader2, Search, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MarkAttendanceStudentList } from '@/components/teacher/mark-attendance-student-list';
import { useToast } from '@/hooks/use-toast';

export default function MarkAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, loading: attendanceLoading, saveAttendanceRecord, getTodaysRecordForStudent } = useAttendance();
  const { toast } = useToast();

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
  
  const handleMarkAllPresent = () => {
    let markedCount = 0;
    departmentStudents.forEach(student => {
      // Only mark students who are visible in the current filtered list
      const record = getTodaysRecordForStudent(student.registerNumber, today);
      if (!record) {
        handleMarkAttendance(student.registerNumber, 'present');
        markedCount++;
      }
    });

    if (markedCount > 0) {
        toast({
            title: `Attendance Marked`,
            description: `${markedCount} student(s) in the current view have been marked as present.`,
        });
    } else {
        toast({
            title: "No Students to Mark",
            description: "All students in the current view already have an attendance record for today.",
        });
    }
  };


  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


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

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
            placeholder="Search by name or register number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            />
        </div>
        <Button onClick={handleMarkAllPresent}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Present
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Mark attendance for each student. Students with attendance already recorded will show their status.
          </CardDescription>
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
