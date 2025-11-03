
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, UserX, History } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { attendanceRecords } = useAttendance();
  const { students, loading: studentsLoading } = useStudents();
  
  const { totalStudents, presentToday, absentToday } = useMemo(() => {
    if (user?.department && user.department !== 'all') {
      const departmentStudents = students.filter(s => s.department === user.department);
      
      const today = new Date().toISOString().split('T')[0];

      const todaysAttendance = attendanceRecords.filter(record => 
        record.date === today && 
        departmentStudents.some(s => s.registerNumber === record.studentRegister)
      );

      const presentStudents = new Set(todaysAttendance.filter(r => r.status === 'present' || r.status === 'late').map(r => r.studentRegister));
      const presentCount = presentStudents.size;
      
      return {
        totalStudents: departmentStudents.length,
        presentToday: presentCount,
        absentToday: departmentStudents.length - presentCount,
      };
    }
    return { totalStudents: 0, presentToday: 0, absentToday: 0 };
  }, [user, students, attendanceRecords]);

  const recentActivity = useMemo(() => {
    if (!user?.department || user.department === 'all') return [];
    
    const departmentStudentRegisters = new Set(students.filter(s => s.department === user.department).map(s => s.registerNumber));
    
    return attendanceRecords
      .filter(record => departmentStudentRegisters.has(record.studentRegister))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Get the 5 most recent records
  }, [user, students, attendanceRecords]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading || studentsLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const departmentDisplay = user.department === 'all' ? 'All Departments' : `${user.department.toUpperCase()} Department`;

  return (
    <>
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
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of recent attendance markings and system events for the {departmentDisplay}.</CardDescription>
        </CardHeader>
        <CardContent>
            {recentActivity.length > 0 ? (
                <div className="space-y-4">
                    {recentActivity.map((record) => {
                       const student = students.find(s => s.registerNumber === record.studentRegister);
                       return (
                        <div key={record.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={student?.photoURL} alt={record.studentName} />
                                <AvatarFallback>{getInitials(record.studentName || 'N A')}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {record.studentName}
                                    <span className="text-sm text-muted-foreground"> ({record.studentRegister})</span>
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    Marked as <Badge variant={record.status === 'absent' ? 'destructive' : 'secondary'} className="capitalize">{record.status}</Badge> via {record.method}.
                                </div>
                            </div>
                            <div className="ml-auto font-medium text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                            </div>
                        </div>
                       )
                    })}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <History className="mx-auto h-8 w-8" />
                    <p className="mt-2">No recent activity to display.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
