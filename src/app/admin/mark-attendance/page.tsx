
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, MoreVertical, LogOut, CheckCircle, Search, XCircle } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import type { Student, AttendanceRecord } from '@/lib/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function MarkAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const { 
    saveAttendanceRecord,
    deleteAttendanceRecord,
    getTodaysRecordForStudent,
    loading: attendanceLoading 
  } = useAttendance();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [studentForLeave, setStudentForLeave] = useState<Student | null>(null);
  const [leaveReason, setLeaveReason] = useState("");

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const departmentStudents = useMemo(() => {
    if (!user?.department || !students) return [];
    const deptStudents = user.department === 'all' ? students : students.filter(s => s.department === user.department);
    
    if (!searchQuery) return deptStudents;

    return deptStudents.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [user, students, searchQuery]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleAction = async (student: Student, status: 'present' | 'absent', method: 'manual' = 'manual', reason?: string) => {
    const recordData: Omit<AttendanceRecord, 'id' | 'timestamp'> = {
      studentRegister: student.registerNumber,
      studentName: student.name,
      date: today,
      status,
      method,
      reason: reason || '',
    };
    
    // The context will handle the async operation and UI updates via snapshot listener
    saveAttendanceRecord(recordData);
    
    toast({
      title: 'Attendance Updated',
      description: `${student.name} marked as ${recordData.reason ? 'On Leave' : status}.`,
    });
  }

  const handleClearAttendance = async (student: Student) => {
    const existingRecord = getTodaysRecordForStudent(student.registerNumber, today);
    if (!existingRecord) return;
    try {
        await deleteAttendanceRecord(student.registerNumber, today);
        toast({
            title: 'Attendance Cleared',
            description: `Attendance for ${student.name} has been reset.`,
        });
    } catch(error: any) {
         toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  }

  const handleMarkOnLeave = async () => {
    if (!studentForLeave || !leaveReason.trim()) {
        toast({
            variant: "destructive",
            title: "Reason Required",
            description: "Please provide a reason for the leave.",
        });
        return;
    }
    await handleAction(studentForLeave, 'present', 'manual', leaveReason);
    setIsLeaveDialogOpen(false);
    setStudentForLeave(null);
    setLeaveReason("");
  }


  const loading = authLoading || studentsLoading || attendanceLoading;

  if (loading && !students.length) {
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
          Manage attendance for {user?.department.toUpperCase()} on {format(new Date(), 'PPP')}.
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                 <div>
                    <CardTitle>Student List</CardTitle>
                    <CardDescription>Mark students present, on leave, or absent.</CardDescription>
                 </div>
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70" />
                    <Input 
                        placeholder="Search by name or register no..." 
                        className="pl-10 placeholder:text-foreground/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departmentStudents.length > 0 ? departmentStudents.map(student => {
                        const record = getTodaysRecordForStudent(student.registerNumber, today);

                        return (
                            <TableRow key={student.registerNumber}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{student.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{student.registerNumber}</TableCell>
                                <TableCell>
                                    {!record ? (
                                        <span className="text-muted-foreground">Not Marked</span>
                                    ) : (
                                        <Badge variant={record.reason ? 'secondary' : record.status === 'present' ? 'default' : 'destructive'}>
                                            {record.reason ? <LogOut className="mr-1.5 h-3.5 w-3.5" /> : null}
                                            {record.status === 'present' && !record.reason ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                                            {record.status === 'absent' ? <XCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                                            {record.reason ? 'On Leave' : (record.status.charAt(0).toUpperCase() + record.status.slice(1))}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{record ? new Date(record.timestamp).toLocaleTimeString() : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleAction(student, 'present', 'manual')}>
                                                <UserCheck className="mr-2 h-4 w-4" /> Mark Present
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setStudentForLeave(student); setIsLeaveDialogOpen(true); }}>
                                                <LogOut className="mr-2 h-4 w-4" /> Mark On Leave
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction(student, 'absent', 'manual')}>
                                                <XCircle className="mr-2 h-4 w-4" /> Mark Absent
                                            </DropdownMenuItem>
                                            {record && (
                                                <DropdownMenuItem onClick={() => handleClearAttendance(student)} className="text-destructive">
                                                    Clear Attendance
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No students found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

        <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mark {studentForLeave?.name} On Leave</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for the student's leave. This will be recorded.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="E.g., Sick leave, family emergency..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleMarkOnLeave}>Approve Leave</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
