'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, UserX, LogOut } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";
import { AttendanceChart } from "@/components/admin/attendance-chart";
import { subDays, format } from 'date-fns';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { attendanceRecords, loading: attendanceLoading } = useAttendance();
  const { students, loading: studentsLoading } = useStudents();
  
  const { totalStudents, presentToday, onLeaveToday, absentToday, weeklyData } = useMemo(() => {
    if (authLoading || studentsLoading || attendanceLoading || !user) {
      return { totalStudents: 0, presentToday: 0, onLeaveToday: 0, absentToday: 0, weeklyData: [] };
    }

    const deptStudents = user.department === 'all' 
      ? students 
      : students.filter(s => s.department === user.department);
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const totalDeptStudents = deptStudents.length;

    const todaysAttendance = attendanceRecords.filter(record => 
      record.date === today && 
      deptStudents.some(s => s.registerNumber === record.studentRegister)
    );

    const presentCount = todaysAttendance.filter(r => r.status === 'present' && !r.reason).length;
    const onLeaveCount = todaysAttendance.filter(r => r.status === 'present' && r.reason).length;
    const absentCount = totalDeptStudents - presentCount - onLeaveCount;

    // --- Weekly data calculation ---
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    const weeklyChartData = last7Days.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const dayOfWeek = format(day, 'EEE');

        const dailyRecords = attendanceRecords.filter(record => 
            record.date === dateString &&
            deptStudents.some(s => s.registerNumber === record.studentRegister)
        );

        const dailyPresent = dailyRecords.filter(r => r.status === 'present' && !r.reason).length;
        const dailyOnLeave = dailyRecords.filter(r => r.status === 'present' && r.reason).length;
        const dailyAbsent = totalDeptStudents - dailyPresent - dailyOnLeave;
        
        return {
            date: dayOfWeek,
            present: dailyPresent,
            absent: dailyAbsent > 0 ? dailyAbsent : 0,
            onLeave: dailyOnLeave,
        };
    });

    return {
      totalStudents: totalDeptStudents,
      presentToday: presentCount,
      onLeaveToday: onLeaveCount,
      absentToday: absentCount > 0 ? absentCount : 0,
      weeklyData: weeklyChartData,
    };
  }, [user, authLoading, students, studentsLoading, attendanceRecords, attendanceLoading]);


  if (authLoading || studentsLoading || attendanceLoading || !user) {
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
            Daily and weekly attendance overview for {departmentDisplay}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <Link href="/admin/students">
            <Button>Add Student</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {totalStudents > 0 ? `${Math.round((presentToday/totalStudents) * 100)}% present` : 'No students enrolled.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              On Leave Today
            </CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLeaveToday}</div>
             <p className="text-xs text-muted-foreground">
              {onLeaveToday} student(s) on approved leave
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
              {absentToday} student(s) absent or not marked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Weekly Attendance Summary</CardTitle>
              <CardDescription>A summary of attendance for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={weeklyData} />
          </CardContent>
      </Card>
    </div>
  );
}
