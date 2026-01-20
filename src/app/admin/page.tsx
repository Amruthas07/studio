'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { attendanceRecords } = useAttendance();
  const { students, loading: studentsLoading } = useStudents();
  
  const { totalStudents, presentToday, absentToday } = useMemo(() => {
    if (!user || students.length === 0) {
      return { totalStudents: 0, presentToday: 0, absentToday: 0 };
    }

    const departmentStudents = user.department === 'all' 
      ? students 
      : students.filter(s => s.department === user.department);
    
    const today = new Date().toISOString().split('T')[0];

    const todaysAttendance = attendanceRecords.filter(record => 
      record.date === today && 
      departmentStudents.some(s => s.registerNumber === record.studentRegister)
    );

    const presentStudents = new Set(todaysAttendance.filter(r => r.matched).map(r => r.studentRegister));
    const presentCount = presentStudents.size;
    
    return {
      totalStudents: departmentStudents.length,
      presentToday: presentCount,
      absentToday: departmentStudents.length - presentCount,
    };
  }, [user, students, attendanceRecords]);


  if (loading || studentsLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const departmentDisplay = user.department === 'all' ? 'All Departments' : `${user.department.toUpperCase()} Department`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
           <h1 className="text-3xl font-bold tracking-tight font-headline">
            {departmentDisplay} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of {departmentDisplay}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <Link href="/admin/students">
            <Button>Add Student</Button>
          </Link>
           <Link href="/admin/reports">
            <Button variant="outline">Export Reports</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {user.department !== 'all' ? `Enrolled in ${user.department.toUpperCase()}` : 'Across all departments'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Present Today
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
             <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? `${Math.round((presentToday/totalStudents) * 100)}% attendance rate` : 'No students enrolled.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Absent Today
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentToday}</div>
             <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? `${absentToday} out of ${totalStudents} absent` : 'No students enrolled.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
