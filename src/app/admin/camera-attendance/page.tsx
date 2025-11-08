
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Video, VideoOff } from 'lucide-react';
import { markAttendanceFromCamera, type MarkAttendanceFromCameraInput } from '@/ai/flows/mark-attendance-with-checks';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { AttendanceRecord, Student } from '@/lib/types';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';

export default function CameraAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { attendanceRecords, addAttendanceRecord } = useAttendance();
  const { students } = useStudents();
  
  const departmentStudents = React.useMemo(() => {
    if (!user?.department || !students) return [];
    if (user.department === 'all') return students;
    return students.filter(s => s.department === user.department);
  }, [user, students]);
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasCameraPermission(true);
          setIsStreaming(true);
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    } else {
       setHasCameraPermission(false);
       toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
       });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };


  const captureAndMarkAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !user?.department || !user?.email || departmentStudents.length === 0) {
        toast({ title: "Error", description: "Video feed, user department, email, or student list not available.", variant: "destructive"});
        return;
    }
    
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const timestamp = new Date().toISOString();
    const today = timestamp.split('T')[0];
    
    // Simulate recognition by picking a random student from the department
    const randomStudent = departmentStudents[Math.floor(Math.random() * departmentStudents.length)];
    if (!randomStudent) {
      toast({ title: "Error", description: "No students found in the department.", variant: "destructive"});
      setIsProcessing(false);
      return;
    }
    
    const todaysRecords = attendanceRecords.filter(rec => rec.date === today);
    
    const input: MarkAttendanceFromCameraInput = {
        studentRegister: randomStudent.registerNumber,
        date: today,
        status: 'present',
        markedBy: user.email,
        method: 'face-scan',
        timestamp: timestamp,
        confidenceScore: 1.0, // Simulate 100% confidence
        existingRecords: todaysRecords,
        students: students, // Pass the full student list for validation
    };

    // No await here for optimistic update
    markAttendanceFromCamera(input).then(result => {
        if (result.success) {
            // Optimistically add record to local state
            const newRecord: AttendanceRecord = {
              id: `temp_${Date.now()}`,
              studentRegister: input.studentRegister,
              studentName: randomStudent.name,
              date: input.date,
              status: input.status,
              markedBy: input.markedBy,
              method: input.method,
              timestamp: input.timestamp,
            };
            addAttendanceRecord(newRecord);

            toast({
                title: "Attendance Marked",
                description: `${randomStudent.name} (${input.studentRegister}) marked as present.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Failed to Mark Attendance",
                description: result.message,
            });
        }
    });

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance</h1>
        <p className="text-muted-foreground">Mark student attendance using the camera. A student's attendance can only be marked once per day.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Camera Feed</CardTitle>
          <CardDescription>Position a student's face in the frame and capture to mark their attendance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-secondary border relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
              {hasCameraPermission === null && !isStreaming && (
                 <>
                    <Camera className="h-12 w-12 mb-4" />
                    <h3 className="font-bold">Camera is Off</h3>
                    <p className="text-sm">Click "Start Camera" to begin the video feed.</p>
                  </>
              )}
              {hasCameraPermission === false && (
                <>
                  <VideoOff className="h-12 w-12 mb-4" />
                  <h3 className="font-bold">Camera Access Required</h3>
                  <p className="text-sm">Please enable camera permissions in your browser settings to use this feature.</p>
                </>
              )}
              {!isStreaming && hasCameraPermission === true && (
                  <>
                    <Camera className="h-12 w-12 mb-4" />
                    <h3 className="font-bold">Camera is Off</h3>
                    <p className="text-sm">Click "Start Camera" to begin the video feed.</p>
                  </>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

           {hasCameraPermission === false && (
              <Alert variant="destructive" className="w-full max-w-2xl">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                   This feature requires camera access. Please update your browser settings to allow this site to use your camera, then refresh the page.
                  </AlertDescription>
              </Alert>
           )}
          
            <div className="flex gap-4">
                <Button 
                    size="lg"
                    onClick={captureAndMarkAttendance}
                    disabled={!isStreaming || isProcessing || hasCameraPermission === false}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Camera />
                            Mark Attendance
                        </>
                    )}
                </Button>
                <Button size="lg" variant="outline" onClick={isStreaming ? stopCamera : startCamera}>
                    {isStreaming ? <VideoOff /> : <Video />}
                    {isStreaming ? 'Stop Camera' : 'Start Camera'}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
