'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, UserX, FileDown } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { mockAttendance, mockStudents } from "@/lib/mock-data";
import { Student } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [absentToday, setAbsentToday] = useState(0);

  useEffect(() => {
    if (user?.department) {
      const allStudents: Student[] = (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('students') || '[]'));
      const departmentStudents = allStudents.filter(s => s.department === user.department);
      
      const today = new Date().toISOString().split('T')[0];

      const todaysAttendance = mockAttendance.filter(record => 
        record.date === today && 
        departmentStudents.some(s => s.registerNumber === record.studentRegister)
      );
      const present = todaysAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      
      setTotalStudents(departmentStudents.length);
      setPresentToday(present);
      setAbsentToday(departmentStudents.length > present ? departmentStudents.length - present : 0);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
           <h1 className="text-3xl font-bold tracking-tight font-headline">
            {user.department.toUpperCase()} Department Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of the {user.department.toUpperCase()} department.
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
              {totalStudents > 0 ? `Currently enrolled in ${user.department.toUpperCase()}` : `No students in ${user.department.toUpperCase()}`}
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
              {totalStudents > 0 ? `${Math.round((presentToday/totalStudents) * 100)}% attendance rate` : 'N/A'}
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
              {totalStudents > 0 ? `${absentToday} out of ${totalStudents} absent` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reports
            </CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              For your department ({user.department.toUpperCase()})
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of recent attendance markings and system events for the {user.department.toUpperCase()} department.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Placeholder for recent activity feed */}
            <div className="text-center text-muted-foreground py-8">
                <p>Recent activity feed will be shown here.</p>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
