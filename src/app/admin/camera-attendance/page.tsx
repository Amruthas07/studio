
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Video, VideoOff } from 'lucide-react';
import { markAttendanceFromCamera, type MarkAttendanceFromCameraInput } from '@/ai/flows/mark-attendance-with-checks';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { AttendanceRecord } from '@/lib/types';
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
  const { addAttendanceRecord } = useAttendance();
  const { students } = useStudents();
  
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
    if (!videoRef.current || !canvasRef.current || !user?.department || !user?.email) {
        toast({ title: "Error", description: "Video feed, user department, or email not available.", variant: "destructive"});
        return;
    }

    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // This is a placeholder for a real face recognition API call
    // In a real app, you would send the canvas image data to a service
    
    const departmentStudents = students.filter((s: any) => s.department === user.department);
    
    if (departmentStudents.length === 0) {
        toast({ title: "No Students", description: `No students enrolled in the ${user.department.toUpperCase()} department.`, variant: "destructive"});
        setIsProcessing(false);
        return;
    }
    
    // Simulate finding a random student from the department
    const randomStudent = departmentStudents[Math.floor(Math.random() * departmentStudents.length)];
    
    const timestamp = new Date().toISOString();
    const input: MarkAttendanceFromCameraInput = {
        studentRegister: randomStudent.registerNumber,
        date: timestamp.split('T')[0],
        status: 'present',
        markedBy: user.email,
        method: 'face-scan',
        timestamp: timestamp,
        confidenceScore: Math.random() * (0.99 - 0.8) + 0.8, // Simulate high confidence
    };

    const result = await markAttendanceFromCamera(input);

    if (result.success) {
      // The local add is now redundant if using Firestore listeners, but good for immediate UI feedback.
      // Firestore will soon be the single source of truth.
      await addAttendanceRecord(input);

      toast({
        title: "Attendance Marked",
        description: `${randomStudent.name} (${randomStudent.registerNumber}) marked as present.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Mark Attendance",
        description: result.message,
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance</h1>
        <p className="text-muted-foreground">Mark student attendance using the camera.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Camera Feed</CardTitle>
          <CardDescription>Position the student's face within the frame and capture.</CardDescription>
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
