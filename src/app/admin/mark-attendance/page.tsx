
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, UserCheck, CheckCircle } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Student } from '@/lib/types';
import { format } from 'date-fns';

export default function MarkAttendancePage() {
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, addAttendanceRecord, loading: attendanceLoading } = useAttendance();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [studentForCamera, setStudentForCamera] = useState<Student | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const departmentStudents = useMemo(() => {
    if (!user?.department || !students) return [];
    if (user.department === 'all') return students;
    return students.filter(s => s.department === user.department);
  }, [user, students]);

  const todaysPresentRegisters = useMemo(() => {
    return new Set(
      attendanceRecords
        .filter(r => r.date === today && r.matched)
        .map(r => r.studentRegister)
    );
  }, [attendanceRecords, today]);

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

  const openCameraDialog = (student: Student) => {
    setStudentForCamera(student);
    setIsCameraDialogOpen(true);
    // Request camera permission when dialog opens
    requestCameraPermission();
  };

  const requestCameraPermission = async () => {
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
  
  const handleCaptureAndMark = async () => {
    if (!videoRef.current || !canvasRef.current || !studentForCamera) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const photoFile = new File([blob], `${studentForCamera.registerNumber}_${today}.jpg`, { type: 'image/jpeg' });
        try {
          await addAttendanceRecord({
            studentRegister: studentForCamera.registerNumber,
            studentName: studentForCamera.name,
            date: today,
            matched: true,
            method: 'live-photo',
            photoFile: photoFile,
          });
          toast({
            title: 'Attendance Marked with Photo',
            description: `${studentForCamera.name} has been marked present.`,
          });
        } catch (error: any) {
           toast({
            variant: 'destructive',
            title: 'Marking Failed',
            description: error.message || 'An unexpected error occurred.',
          });
        } finally {
          setIsCameraDialogOpen(false);
          setIsCapturing(false);
          setStudentForCamera(null);
        }
      }
    }, 'image/jpeg');
  };
  
  const onDialogClose = () => {
    // Turn off camera when dialog closes
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraDialogOpen(false);
    setStudentForCamera(null);
  };
  
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
      <canvas ref={canvasRef} className="hidden" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mark Attendance</h1>
        <p className="text-muted-foreground">
          Manually mark attendance for students in the {user?.department.toUpperCase()} department for today, {format(new Date(), 'PPP')}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Students not marked present will be considered absent.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStudents.map((student) => {
              const isPresent = todaysPresentRegisters.has(student.registerNumber);
              return (
                <div key={student.registerNumber} className={`p-4 rounded-lg border flex items-center justify-between ${isPresent ? 'bg-secondary' : 'bg-card'}`}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {isPresent ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="h-5 w-5" />
                        <span>Present</span>
                      </div>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleMarkManually(student)} disabled={!student.photoEnrolled}>
                          <UserCheck className="mr-2 h-4 w-4" /> Manual
                        </Button>
                        <Button size="sm" onClick={() => openCameraDialog(student)} disabled={!student.photoEnrolled}>
                           <Camera className="mr-2 h-4 w-4" /> Camera
                        </Button>
                        {!student.photoEnrolled && (
                            <p className="text-xs text-destructive text-center">Enroll photo to mark</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
             {departmentStudents.length === 0 && (
                <p className="text-muted-foreground text-center col-span-full py-8">No students found in this department.</p>
             )}
          </div>
        </CardContent>
      </Card>

       <Dialog open={isCameraDialogOpen} onOpenChange={onDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture photo for {studentForCamera?.name}</DialogTitle>
            <DialogDescription>
              Position the student's face clearly in the frame and capture the photo for verification.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-destructive-foreground bg-destructive/80">
                    Camera access denied. Please enable it in your browser settings.
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onDialogClose}>Cancel</Button>
            <Button onClick={handleCaptureAndMark} disabled={isCapturing || hasCameraPermission !== true}>
              {isCapturing ? <Loader2 className="animate-spin" /> : <Camera />}
              Capture and Mark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
