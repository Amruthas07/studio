
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, UserCheck, Users, XCircle, VideoOff } from 'lucide-react';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';
import type { Student } from '@/lib/types';
import { recognizeFace } from '@/app/actions';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Helper to convert a URL to a data URI
async function urlToDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


type StudentWithPhotoData = Student & { profilePhotoDataUri?: string };
type ScanLogEntry = {
    id: string;
    timestamp: Date;
    message: string;
    status: 'success' | 'info' | 'error';
    student?: Student;
};

const SCAN_INTERVAL = 3000; // Scan every 3 seconds

export default function LiveAttendancePage() {
    const { students, loading: studentsLoading } = useStudents();
    const { addAttendanceRecord, getTodaysRecordForStudent } = useAttendance();
    const { toast } = useToast();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [studentsWithPhotos, setStudentsWithPhotos] = useState<StudentWithPhotoData[]>([]);
    const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);

    // Prepare student data with data URIs for their photos
    useEffect(() => {
        if (students.length > 0) {
            setLoadingMessage(`Preparing ${students.length} student profiles for recognition...`);
            Promise.all(students.map(async (student) => {
                if (student.profilePhotoUrl) {
                    try {
                        const dataUri = await urlToDataUri(student.profilePhotoUrl);
                        return { ...student, profilePhotoDataUri: dataUri };
                    } catch (error) {
                        console.error(`Failed to load image for ${student.name}:`, error);
                        return student; // return student without data uri on error
                    }
                }
                return student;
            })).then(studentsWithData => {
                setStudentsWithPhotos(studentsWithData.filter(s => s.profilePhotoDataUri));
                setIsLoading(false);
                setLoadingMessage("");
            });
        } else if (!studentsLoading) {
            setIsLoading(false); // No students to load
        }
    }, [students, studentsLoading]);

    // Setup and teardown camera
    useEffect(() => {
        if (isScanning) {
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
                    setIsScanning(false);
                    toast({
                        variant: 'destructive',
                        title: 'Camera Access Denied',
                        description: 'Please enable camera permissions to use live scanning.',
                    });
                }
            };
            getCameraPermission();
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setHasCameraPermission(null);
        }

        return () => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [isScanning, toast]);


    const logScan = (message: string, status: 'success' | 'info' | 'error', student?: Student) => {
        setScanLog(prev => [{ id: Date.now().toString(), timestamp: new Date(), message, status, student }, ...prev].slice(0, 10));
    };

    const runScan = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || studentsWithPhotos.length === 0 || !videoRef.current.srcObject) {
            return;
        }
        
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const cameraPhotoUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await recognizeFace({
                cameraPhotoUri,
                students: studentsWithPhotos.map(({registerNumber, name, profilePhotoDataUri}) => ({registerNumber, name, profilePhotoUri: profilePhotoDataUri!}))
            });

            if (result.matchStatus === 'MATCH' && result.registerNumber) {
                const today = format(new Date(), 'yyyy-MM-dd');
                const existingRecord = getTodaysRecordForStudent(result.registerNumber, today);

                if (existingRecord?.status === 'present') {
                    // Already marked present, do nothing.
                    return;
                }
                
                const matchedStudent = students.find(s => s.registerNumber === result.registerNumber);

                if (matchedStudent) {
                    await addAttendanceRecord({
                        studentRegister: matchedStudent.registerNumber,
                        studentName: matchedStudent.name,
                        date: today,
                        status: 'present',
                        method: 'face-scan',
                    });
                    logScan(`Marked ${matchedStudent.name} present.`, 'success', matchedStudent);
                    toast({
                        title: "Attendance Marked",
                        description: `${matchedStudent.name} has been marked present.`
                    });
                }
            } else if (result.matchStatus === 'NO_MATCH') {
                 logScan('No clear match found in frame.', 'info');
            } else if (result.matchStatus === 'MULTIPLE_FACES') {
                 logScan('Multiple faces detected. Please show one face at a time.', 'info');
            }

        } catch (error) {
            console.error('Scan failed:', error);
            logScan('An error occurred during scan.', 'error');
        }

    }, [studentsWithPhotos, addAttendanceRecord, getTodaysRecordForStudent, students, toast]);

    // Scanning loop
    useEffect(() => {
        if (isScanning && !isLoading && hasCameraPermission) {
            scannerTimeoutRef.current = setInterval(runScan, SCAN_INTERVAL);
        } else {
            if (scannerTimeoutRef.current) {
                clearInterval(scannerTimeoutRef.current);
            }
        }

        return () => {
            if (scannerTimeoutRef.current) {
                clearInterval(scannerTimeoutRef.current);
            }
        };
    }, [isScanning, isLoading, hasCameraPermission, runScan]);

    if (studentsLoading) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Live Attendance Scan</h1>
                    <p className="text-muted-foreground">The system will automatically detect and mark students present.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="scan-toggle" checked={isScanning} onCheckedChange={setIsScanning} disabled={isLoading} />
                    <Label htmlFor="scan-toggle" className="text-lg">{isScanning ? "Scanning..." : "Scanner Off"}</Label>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Camera Feed</CardTitle>
                        <CardDescription>Position student faces clearly in the video frame.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                            {isScanning ? (
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <VideoOff className="mx-auto h-16 w-16" />
                                    <p className="mt-4">Camera is off. Toggle the switch to start scanning.</p>
                                </div>
                            )}
                             {isLoading && isScanning && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="mt-2">{loadingMessage}</p>
                                </div>
                            )}
                            {hasCameraPermission === false && (
                                <Alert variant="destructive" className="absolute bottom-4 left-4 right-4 w-auto">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Scan Log</CardTitle>
                        <CardDescription>A log of the most recent scan events.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {scanLog.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <Users className="mx-auto h-8 w-8" />
                                <p className="mt-2">No scans yet. Start the scanner.</p>
                            </div>
                        )}
                        {scanLog.map(log => (
                            <div key={log.id} className="flex items-start gap-3">
                                <div className="mt-1">
                                    {log.status === 'success' && <UserCheck className="h-5 w-5 text-green-500" />}
                                    {log.status === 'info' && <Camera className="h-5 w-5 text-blue-500" />}
                                    {log.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{log.message}</p>
                                    <p className="text-xs text-muted-foreground">{format(log.timestamp, 'hh:mm:ss a')}</p>
                                </div>
                                {log.student?.profilePhotoUrl && (
                                    <Image src={log.student.profilePhotoUrl} alt={log.student.name} width={40} height={40} className="rounded-full" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
