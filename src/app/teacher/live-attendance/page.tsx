
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { LiveAttendanceControls } from '@/components/teacher/live-attendance-controls';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';

export default function LiveAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { saveAttendanceRecord } = useAttendance();

  const loading = authLoading || studentsLoading;

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const departmentStudents = students.filter(student => student.department === user.department);

  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Live Attendance Capture
        </h1>
        <p className="text-foreground">
          Use the camera to capture attendance for department: <span className="font-bold uppercase">{user.department}</span>
        </p>
      </div>
      <LiveAttendanceControls 
        students={departmentStudents} 
        onMarkAttendance={saveAttendanceRecord}
        userEmail={user.email!}
      />
    </div>
  );
}
