'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, UserCheck, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { getImageHash } from '@/lib/utils';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Student } from '@/lib/types';

type Status = 'idle' | 'capturing' | 'processing' | 'success' | 'no_match' | 'already_marked' | 'error';

export default function LiveAttendancePage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const { toast } = useToast();
  const { attendanceRecords, addAttendanceRecord } = useAttendance();
  const { students } = useStudents();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleRetake = useCallback(() => {
    setPhotoFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setMessage('');
    setMatchedStudent(null);
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  useEffect(() => {
    if (['success', 'no_match', 'already_marked'].includes(status)) {
      const timer = setTimeout(() => {
        handleRetake();
      }, 3000); // Automatically resets after 3 seconds for a new capture

      return () => clearTimeout(timer);
    }
  }, [status, handleRetake]);


  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('capturing');
    setMessage('');

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
        setStatus('error');
        setMessage('Could not capture photo from camera.');
        return;
    };
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], "live_capture.jpg", { type: "image/jpeg" });
            setPhotoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }, 'image/jpeg');
  };

  const handleIdentifyAndMark = async () => {
    if (!photoFile) return;
    
    setStatus('processing');
    setMessage('Analyzing photo and identifying student...');
    setMatchedStudent(null);

    try {
        const currentHash = await getImageHash(photoFile);
        const enrolledStudents = students.filter(s => s.photoEnrolled);
        const student = enrolledStudents.find(s => s.photoHash === currentHash);
        
        if (!student) {
            setStatus('no_match');
            setMessage('Could not identify student. Please try another photo.');
            return;
        }

        setMatchedStudent(student);
        
        const today = new Date().toISOString().split('T')[0];
        const alreadyMarked = attendanceRecords.some(
            record => record.studentRegister === student.registerNumber && record.date === today
        );

        if (alreadyMarked) {
            setStatus('already_marked');
            setMessage(`Attendance has already been marked for ${student.name} today.`);
            return;
        }

        await addAttendanceRecord({
            studentRegister: student.registerNumber,
            date: today,
            matched: true,
            method: 'live-photo',
            confidence: 100, // Hash match is 100% confidence
            photoFile: photoFile,
        });

        setStatus('success');
        setMessage(`${student.name} (${student.registerNumber}) has been marked as present.`);
        toast({
            title: "Attendance Marked!",
            description: `${student.name} has been marked present.`,
        });

    } catch (error: any) {
        setStatus('error');
        setMessage(error.message || "An unexpected error occurred during identification.");
        setMatchedStudent(null);
        toast({
            variant: "destructive",
            title: "Attendance Failed",
            description: error.message || "An unexpected error occurred.",
        });
    }
  };
  
  const StatusIndicator = () => {
      if (status === 'idle' || status === 'capturing' || !message) return null;
      
      const statusConfig = {
          processing: { icon: Loader2, color: 'text-blue-500', spin: true },
          success: { icon: CheckCircle, color: 'text-green-500' },
          no_match: { icon: AlertCircle, color: 'text-orange-500' },
          already_marked: { icon: Info, color: 'text-blue-500' },
          error: { icon: AlertCircle, color: 'text-red-500' },
      };
      
      const config = statusConfig[status as keyof typeof statusConfig];
      if (!config) return null;

      const Icon = config.icon;

      return (
        <div className={`flex items-center justify-center gap-2 p-3 rounded-md bg-secondary ${config.color}`}>
            <Icon className={`h-5 w-5 ${config.spin ? 'animate-spin' : ''}`} />
            <span className="font-semibold">{message}</span>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance</h1>
        <p className="text-muted-foreground">Capture a student's photo to mark their attendance for today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Camera Identification</CardTitle>
          <CardDescription>Position the student's face clearly in the frame and capture the photo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
             {previewUrl ? (
                <Image src={previewUrl} alt="Attendance photo preview" layout="fill" objectFit="contain" />
            ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            )}

            { (status === 'success' || status === 'already_marked') && matchedStudent && (
              <div 
                  className="absolute border-4 border-primary rounded-lg pointer-events-none"
                  style={{ 
                      width: '40%', 
                      height: '60%',
                      top: '20%',
                      left: '30%',
                  }}
              >
                  <span className="absolute -top-8 left-0 bg-primary text-primary-foreground px-2 py-1 text-sm rounded-md whitespace-nowrap">
                      {matchedStudent.name}
                  </span>
              </div>
            )}

             {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4">
                    <Alert variant="destructive" className="max-w-sm">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
             )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
           <div className="w-full max-w-2xl min-h-[56px]">
            <StatusIndicator />
           </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            {previewUrl ? (
              <>
                <Button size="lg" className="w-full" onClick={handleRetake} variant="outline" disabled={status === 'processing'}>
                  <RefreshCw />
                  Retake Photo
                </Button>
                <Button size="lg" className="w-full" onClick={handleIdentifyAndMark} disabled={status === 'processing' || status === 'success'}>
                  {status === 'processing' ? <Loader2 className="animate-spin" /> : <UserCheck />}
                  Identify & Mark
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-full" onClick={handleCapturePhoto} disabled={hasCameraPermission !== true}>
                <Camera />
                Capture Photo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
