
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, Camera, MoreVertical, LogOut, CheckCircle, Search, XCircle } from 'lucide-react';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [studentToCapture, setStudentToCapture] = useState<Student | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [studentForLeave, setStudentForLeave] = useState<Student | null>(null);
  const [leaveReason, setLeaveReason] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (isCameraDialogOpen) {
      setIsCameraReady(false); // Reset camera ready state
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
          setIsCameraDialogOpen(false);
        }
      };
      getCameraPermission();

      return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isCameraDialogOpen, toast]);

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

  const handleAction = async (student: Student, status: 'present' | 'absent', method: 'manual' | 'live-photo' = 'manual', reason?: string) => {
    try {
        const recordData: any = {
            studentRegister: student.registerNumber,
            studentName: student.name,
            date: today,
            status,
            method,
            reason: reason || '',
        };

        await saveAttendanceRecord(recordData);
        
        toast({
            title: 'Attendance Updated',
            description: `${student.name} marked as ${recordData.reason ? 'On Leave' : status}.`,
        });
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
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

  const handleCaptureAndMark = async () => {
    if (!videoRef.current || !canvasRef.current || !studentToCapture) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
        toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not get canvas context.' });
        return;
    }
    context.drawImage(videoRef.current, 0, 0);

    try {
        const photoDataUrl = canvas.toDataURL('image/jpeg');
        
        if (photoDataUrl) {
            const recordData = {
                studentRegister: studentToCapture.registerNumber,
                studentName: studentToCapture.name,
                date: today,
                status: 'present' as const,
                method: 'live-photo' as const,
                reason: '',
            };

            await saveAttendanceRecord(recordData, photoDataUrl);
            
            toast({
                title: 'Attendance Updated',
                description: `${studentToCapture.name} has been marked as present.`,
            });
            
            setIsCameraDialogOpen(false);
            setStudentToCapture(null);
        } else {
            toast({
                variant: 'destructive',
                title: 'Capture Failed',
                description: 'Could not create image from camera.',
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred while marking attendance.",
        });
        console.error("Capture and mark failed:", error);
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
                    <CardDescription>Mark students present, on leave, or capture their photo.</CardDescription>
                 </div>
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or register no..." 
                        className="pl-10"
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
                                             <DropdownMenuItem onClick={() => { setStudentToCapture(student); setIsCameraDialogOpen(true); }}>
                                                <Camera className="mr-2 h-4 w-4" /> Mark with Camera
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

       <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Capture Photo for {studentToCapture?.name}</DialogTitle>
                    <DialogDescription>
                        Position the student's face in the frame and click capture.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                       <video 
                            ref={videoRef} 
                            className="w-full aspect-video rounded-md" 
                            autoPlay 
                            muted
                            onLoadedData={() => setIsCameraReady(true)}
                        />
                       <canvas ref={canvasRef} className="hidden" />
                    </div>
                     {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCaptureAndMark} disabled={!hasCameraPermission || !isCameraReady}>
                        {!isCameraReady ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2" />
                        )}
                        {!isCameraReady ? 'Initializing Camera...' : 'Capture and Mark Present'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
