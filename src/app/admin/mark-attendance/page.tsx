
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, CheckCircle, ChevronsUpDown } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import type { Student } from '@/lib/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


export default function MarkAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, addAttendanceRecord, loading: attendanceLoading } = useAttendance();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [comboboxOpen, setComboboxOpen] = useState(false);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const { departmentStudents, presentStudents, absentStudents } = useMemo(() => {
    if (!user?.department || !students) return { departmentStudents: [], presentStudents: [], absentStudents: [] };

    const deptStudents = user.department === 'all' ? students : students.filter(s => s.department === user.department);

    const todaysPresentRegisters = new Set(
      attendanceRecords
        .filter(r => r.date === today && r.matched)
        .map(r => r.studentRegister)
    );

    const present = deptStudents.filter(s => todaysPresentRegisters.has(s.registerNumber));
    const absent = deptStudents.filter(s => !todaysPresentRegisters.has(s.registerNumber));

    return { departmentStudents: deptStudents, presentStudents: present, absentStudents: absent };
  }, [user, students, attendanceRecords, today]);


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleMarkManually = async (student: Student) => {
    try {
      await addAttendanceRecord({
        studentRegister: student.registerNumber,
        studentName: student.name,
        date: today,
        matched: true,
        method: 'manual',
      });
      toast({
        title: 'Attendance Marked',
        description: `${student.name} has been marked as present.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Marking Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const onStudentSelect = (registerNumber: string) => {
    const student = absentStudents.find(s => s.registerNumber === registerNumber);
    if (student) {
      handleMarkManually(student);
    }
    setComboboxOpen(false);
  }

  const loading = authLoading || studentsLoading || attendanceLoading;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mark Attendance</h1>
        <p className="text-muted-foreground">
          Select a student to mark them as present for today, {format(new Date(), 'PPP')}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
                <CardTitle>Mark Student Present</CardTitle>
                <CardDescription>Select a student from the list to mark their attendance.</CardDescription>
            </CardHeader>
            <CardContent>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between"
                             disabled={absentStudents.length === 0}
                        >
                            {absentStudents.length > 0 ? "Select a student..." : "All students are present"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder="Search student..." />
                            <CommandList>
                                <CommandEmpty>No students found.</CommandEmpty>
                                <CommandGroup>
                                    {absentStudents.map((student) => (
                                        <CommandItem
                                            key={student.registerNumber}
                                            value={`${student.name} ${student.registerNumber}`}
                                            onSelect={() => onStudentSelect(student.registerNumber)}
                                        >
                                            <CheckCircle className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <span>{student.name} ({student.registerNumber})</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                 {absentStudents.length === 0 && departmentStudents.length > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-md bg-secondary p-4 text-center text-sm text-secondary-foreground">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p>All students in {user?.department.toUpperCase()} are marked present!</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Present Students ({presentStudents.length} / {departmentStudents.length})</CardTitle>
                <CardDescription>Students marked as present for today.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Register No.</TableHead>
                              <TableHead>Timestamp</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {presentStudents.length > 0 ? presentStudents
                              .sort((a, b) => {
                                const recA = attendanceRecords.find(r => r.studentRegister === a.registerNumber && r.date === today);
                                const recB = attendanceRecords.find(r => r.studentRegister === b.registerNumber && r.date === today);
                                return new Date(recB?.timestamp || 0).getTime() - new Date(recA?.timestamp || 0).getTime();
                              })
                              .map((student) => {
                                  const record = attendanceRecords.find(r => r.studentRegister === student.registerNumber && r.date === today);
                                  return (
                                      <TableRow key={student.registerNumber}>
                                          <TableCell>
                                              <div className="flex items-center gap-3">
                                                  <Avatar className="h-9 w-9">
                                                      <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                                                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                  </Avatar>
                                                  <div className="font-medium">{student.name}</div>
                                              </div>
                                          </TableCell>
                                          <TableCell>{student.registerNumber}</TableCell>
                                          <TableCell>{record ? new Date(record.timestamp).toLocaleTimeString() : 'N/A'}</TableCell>
                                      </TableRow>
                                  )
                              }) : (
                                  <TableRow>
                                      <TableCell colSpan={3} className="h-24 text-center">
                                          No students have been marked present yet.
                                      </TableCell>
                                  </TableRow>
                              )}
                      </TableBody>
                  </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
