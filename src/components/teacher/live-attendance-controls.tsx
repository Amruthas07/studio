
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, UserCheck, UserX, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import Image from 'next/image';
import type { Student, LiveCaptureRecord, AttendanceRecord } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


interface LiveAttendanceControlsProps {
    students: Student[];
    onMarkAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'photoUrl' | 'department' | 'studentUid'>, photoDataUrl?: string) => void;
    userEmail: string;
}

export function LiveAttendanceControls({ students, onMarkAttendance, userEmail }: LiveAttendanceControlsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captures, setCaptures] = useState<LiveCaptureRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
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
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const photoDataUrl = canvas.toDataURL('image/jpeg');

    const newCapture: LiveCaptureRecord = {
        id: `capture-${Date.now()}`,
        photoUrl: photoDataUrl,
        result: 'processing' as any, // Temporary state
        timestamp: new Date(),
    };
    setCaptures(prev => [newCapture, ...prev]);

    // --- Backend Simulation ---
    setTimeout(() => {
        // This simulates a call to a face recognition backend.
        const randomOutcome = Math.random();
        
        let updatedCapture = { ...newCapture };
        
        if (randomOutcome < 0.7 && students.length > 0) { // 70% chance of match
            const randomStudent = students[Math.floor(Math.random() * students.length)];
            updatedCapture = {
                ...updatedCapture,
                result: 'matched',
                confidence: Math.random() * (100 - 85) + 85, // 85-100% confidence
                matchedStudentId: randomStudent.registerNumber,
                matchedStudentName: randomStudent.name,
            };
            // Mark attendance
            const today = format(new Date(), 'yyyy-MM-dd');
            onMarkAttendance({
                studentRegister: randomStudent.registerNumber,
                date: today,
                status: 'present',
                method: 'live-photo',
                markedBy: userEmail,
            }, photoDataUrl);
        } else if (randomOutcome < 0.9) { // 20% chance of no match
            updatedCapture = { ...updatedCapture, result: 'unmatched' };
        } else { // 10% chance of multiple faces
            updatedCapture = { ...updatedCapture, result: 'multiple' };
        }

        setCaptures(prev => prev.map(c => c.id === updatedCapture.id ? updatedCapture : c));
        setIsCapturing(false);
    }, 2000); // Simulate 2 second processing time
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Camera Feed</CardTitle>
                <CardDescription>Point the camera at students to capture attendance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden flex items-center justify-center relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission === false && (
                         <Alert variant="destructive" className="m-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                     {hasCameraPermission === null && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                             <Loader2 className="h-8 w-8 animate-spin text-white" />
                         </div>
                    )}
                </div>
                 <Button onClick={handleCapture} disabled={!hasCameraPermission || isCapturing} className="w-full mt-4">
                    {isCapturing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-4 w-4" />
                            Capture Attendance
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Recent Captures</CardTitle>
                <CardDescription>Live feed of attendance marking results.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[450px]">
                    <div className="space-y-4">
                        {captures.length === 0 && (
                            <div className="text-center text-muted-foreground py-16">
                                <Camera className="mx-auto h-12 w-12" />
                                <p className="mt-4">No captures yet. Start taking attendance.</p>
                            </div>
                        )}
                        {captures.map(capture => {
                            const student = students.find(s => s.registerNumber === capture.matchedStudentId);
                            return (
                                <div key={capture.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-16 h-16 rounded-md overflow-hidden relative bg-secondary">
                                        <Image src={capture.photoUrl} alt={`Capture at ${capture.timestamp}`} layout="fill" objectFit="cover" />
                                    </div>
                                    <div className="flex-1">
                                        {capture.result === 'processing' && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        )}
                                        {capture.result === 'matched' && student && (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                                                <UserCheck className="h-5 w-5" />
                                                <div>
                                                    <p>{student.name}</p>
                                                    <p className="text-xs font-normal text-muted-foreground">{student.registerNumber} - {Math.round(capture.confidence || 0)}% Match</p>
                                                </div>
                                            </div>
                                        )}
                                        {capture.result === 'unmatched' && (
                                            <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-semibold">
                                                <UserX className="h-5 w-5" />
                                                <span>No Match Found</span>
                                            </div>
                                        )}
                                        {capture.result === 'multiple' && (
                                            <div className="flex items-center gap-2 text-orange-500 font-semibold">
                                                <Users className="h-5 w-5" />
                                                <span>Multiple Faces Detected</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">{format(capture.timestamp, "hh:mm:ss a")}</p>
                                    </div>
                                    {student && (
                                        <Avatar>
                                            <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
