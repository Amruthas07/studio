
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';
import { Loader2, Search, CheckCheck, BookOpen, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MarkAttendanceStudentList } from '@/components/teacher/mark-attendance-student-list';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SemesterTabContent = ({ sem, students, allRecords, user, onMarkAttendance, onMarkAllPresent }: {
    sem: number;
    students: Student[];
    allRecords: any[];
    user: any;
    onMarkAttendance: (studentRegister: string, status: 'present' | 'absent', subject: string, reason?: string) => void;
    onMarkAllPresent: (studentsInSemester: Student[], subject: string) => void;
}) => {
    const subjectsForSemester = user.subjects?.[sem] || [];
    const [selectedSubject, setSelectedSubject] = React.useState(subjectsForSemester[0] || '');
    const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    React.useEffect(() => {
        if (subjectsForSemester.length > 0 && !subjectsForSemester.includes(selectedSubject)) {
            setSelectedSubject(subjectsForSemester[0]);
        }
    }, [subjectsForSemester, selectedSubject]);

    // Calculate unmarked students for notification
    const unmarkedCount = React.useMemo(() => {
        if (!selectedSubject) return 0;
        return students.filter(student => {
            const hasRecord = allRecords.some(r => 
                r.studentRegister === student.registerNumber && 
                r.date === today && 
                r.subject === selectedSubject
            );
            return !hasRecord;
        }).length;
    }, [students, allRecords, today, selectedSubject]);

    if (subjectsForSemester.length === 0) {
        return (
            <TabsContent value={String(sem)} className="mt-4">
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No subjects assigned to you for Semester {sem}.
                    </CardContent>
                </Card>
            </TabsContent>
        );
    }

    return (
        <TabsContent value={String(sem)} className="mt-4 space-y-6">
            <div className="flex flex-wrap gap-2">
                {subjectsForSemester.map(subj => (
                    <Button 
                        key={subj} 
                        variant={selectedSubject === subj ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSubject(subj)}
                        className="rounded-full gap-2"
                    >
                        <BookOpen className="h-4 w-4" />
                        {subj}
                    </Button>
                ))}
            </div>

            {/* Notification Alert for incomplete attendance */}
            {selectedSubject && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {unmarkedCount > 0 ? (
                        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold">Attendance Incomplete</AlertTitle>
                            <AlertDescription>
                                There are still <strong>{unmarkedCount}</strong> student(s) without a recorded status for {selectedSubject} today. Please ensure all students are marked.
                            </AlertDescription>
                        </Alert>
                    ) : students.length > 0 ? (
                        <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="font-bold">Attendance Complete</AlertTitle>
                            <AlertDescription>
                                All students in Semester {sem} have been marked for {selectedSubject}.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {selectedSubject}
                            <Badge variant="secondary">Semester {sem}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Marking attendance for {students.length} student(s).
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => onMarkAllPresent(students, selectedSubject)}
                        disabled={students.length === 0 || !selectedSubject}
                        variant="secondary"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All Present
                    </Button>
                </CardHeader>
                <CardContent>
                    <MarkAttendanceStudentList
                        students={students}
                        allDepartmentRecords={allRecords}
                        onMarkAttendance={onMarkAttendance}
                        subject={selectedSubject}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    );
};


export default function MarkAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, loading: attendanceLoading, saveAttendanceRecord } = useAttendance();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleMarkAttendance = (studentRegister: string, status: 'present' | 'absent', subject: string, reason?: string) => {
    if (!user?.uid) return;
    saveAttendanceRecord({
        studentRegister,
        date: today,
        status,
        reason,
        method: 'manual',
        markedBy: user.uid,
    }, subject);
  };
  
  const handleMarkAllPresentForSemester = (studentsInSemester: Student[], subject: string) => {
    if (studentsInSemester.length === 0) {
        toast({
            title: "No Students to Mark",
            description: "There are no students in this semester.",
        });
        return;
    }

    if (!subject) {
        toast({
            variant: "destructive",
            title: "No Subject Selected",
            description: "Please select a subject before marking all as present.",
        });
        return;
    }

    studentsInSemester.forEach(student => {
      handleMarkAttendance(student.registerNumber, 'present', subject);
    });

    toast({
        title: `Attendance Marked`,
        description: `All ${studentsInSemester.length} student(s) marked as present for ${subject}.`,
    });
  };


  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const semesters = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
            Mark Daily Attendance
            </h1>
            <div className="text-muted-foreground flex items-center flex-wrap gap-x-2">
                <span>{format(new Date(), 'EEEE, do MMMM yyyy')}</span>
                {currentTime && (
                    <span className="text-primary font-bold flex items-center gap-1.5 border-l pl-3 ml-1">
                        <Clock className="h-4 w-4" />
                        {format(currentTime, 'hh:mm:ss a')}
                    </span>
                )}
            </div>
        </div>
        <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
            />
        </div>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-muted/50">
          {semesters.map(sem => (
            <TabsTrigger 
                key={sem} 
                value={String(sem)}
                className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
                Sem {sem}
            </TabsTrigger>
          ))}
        </TabsList>

        {semesters.map(sem => {
          const semesterStudents = departmentStudents.filter(s => s.semester === sem);
          
          return (
            <SemesterTabContent
                key={sem}
                sem={sem}
                students={semesterStudents}
                allRecords={attendanceRecords}
                user={user}
                onMarkAttendance={handleMarkAttendance}
                onMarkAllPresent={handleMarkAllPresentForSemester}
            />
          )
        })}
      </Tabs>
    </div>
  );
}
