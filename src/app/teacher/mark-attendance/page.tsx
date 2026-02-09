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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// New component for the tab content
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

    React.useEffect(() => {
        if (subjectsForSemester.length > 0 && !subjectsForSemester.includes(selectedSubject)) {
            setSelectedSubject(subjectsForSemester[0]);
        }
    }, [subjectsForSemester, selectedSubject]);

    return (
        <TabsContent value={String(sem)} className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Semester {sem} Students</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            {subjectsForSemester.length > 0 ? (
                                <>
                                    <span>Subject:</span>
                                    {subjectsForSemester.length === 1 ? (
                                        <span className="font-semibold">{subjectsForSemester[0]}</span>
                                    ) : (
                                        <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                                            <SelectTrigger className="w-[250px] h-8">
                                                <SelectValue placeholder="Select a subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjectsForSemester.map(subj => (
                                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </>
                            ) : 'No subject assigned for this semester.'}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => onMarkAllPresent(students, selectedSubject)}
                        disabled={students.length === 0 || !selectedSubject}
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
        description: `A "Present" status has been sent for all ${studentsInSemester.length} student(s) for the subject ${subject}.`,
    });
  };


  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

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
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          {semesters.map(sem => (
            <TabsTrigger key={sem} value={String(sem)}>Sem {sem}</TabsTrigger>
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
