
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, UserCheck, RefreshCw } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { getImageHash } from '@/lib/utils';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CameraAttendancePage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { attendanceRecords, addAttendanceRecord } = useAttendance();
  const { students } = useStudents();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    if (!context) {
        toast({ title: "Error", description: "Could not capture photo.", variant: "destructive"});
        return;
    };
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // Convert canvas to a Blob, then to a File
    canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], "attendance_capture.jpg", { type: "image/jpeg" });
            setPhotoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }, 'image/jpeg');
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
  };

  const handleMarkAttendance = async () => {
    if (!photoFile) {
        toast({ title: "Error", description: "Please capture a photo to mark attendance.", variant: "destructive"});
        return;
    }
    
    setIsProcessing(true);

    try {
        const currentHash = await getImageHash(photoFile);

        const matchedStudent = students.find(s => s.photoHash === currentHash);
        
        if (!matchedStudent) {
            throw new Error("No matching student found in the database. Please ensure the student is enrolled.");
        }
        
        const today = new Date().toISOString().split('T')[0];
        const alreadyMarked = attendanceRecords.some(
            record => record.studentRegister === matchedStudent.registerNumber && record.date === today
        );

        if (alreadyMarked) {
            throw new Error(`Attendance has already been marked for ${matchedStudent.name} today.`);
        }

        await addAttendanceRecord({
            studentRegister: matchedStudent.registerNumber,
            date: today,
            matched: true
        });

        toast({
            title: "Attendance Marked!",
            description: `${matchedStudent.name} (${matchedStudent.registerNumber}) has been marked as present.`,
        });

        handleRetake();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Attendance Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mark Attendance</h1>
        <p className="text-muted-foreground">Capture a student's photo to mark their attendance for today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Camera Attendance</CardTitle>
          <CardDescription>Position the student's face clearly in the frame and capture the photo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
             {previewUrl ? (
                <Image src={previewUrl} alt="Attendance photo preview" layout="fill" objectFit="contain" />
            ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
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
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            {previewUrl ? (
              <>
                <Button size="lg" className="w-full" onClick={handleRetake} variant="outline" disabled={isProcessing}>
                  <RefreshCw />
                  Retake Photo
                </Button>
                <Button size="lg" className="w-full" onClick={handleMarkAttendance} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin" /> : <UserCheck />}
                  Mark Attendance
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-full" onClick={handleCapturePhoto} disabled={isProcessing || hasCameraPermission !== true}>
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
