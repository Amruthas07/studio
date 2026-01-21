
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, UserCheck, Users, XCircle, VideoOff, CheckCircle } from 'lucide-react';
import { useStudents } from '@/hooks/use-students';
import { useAttendance } from '@/hooks/use-attendance';
import type { Student } from '@/lib/types';
import { recognizeFace } from '@/app/actions';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';


type ScanLogEntry = {
    id: string;
    timestamp: Date;
    message: string;
    status: 'success' | 'info' | 'error';
    student?: Student;
};

const SCAN_INTERVAL = 3000; // Scan every 3 seconds

export default function LiveAttendancePage() {
    const { user } = useAuth();
    const { students, loading: studentsLoading } = useStudents();
    const { addAttendanceRecord, getTodaysRecordForStudent } = useAttendance();
    const { toast } = useToast();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    
    const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    
    useEffect(() => {
        if (user && user.department !== 'all') {
            setSelectedDepartment(user.department);
        }
    }, [user]);

    const departmentStudents = React.useMemo(() => {
        if (selectedDepartment === 'all') {
            return students;
        }
        return students.filter(s => s.department === selectedDepartment);
    }, [students, selectedDepartment]);


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
        const eligibleStudents = students.filter(s => s.profilePhotoUrl);

        const studentsForScan = selectedDepartment === 'all'
            ? eligibleStudents
            : eligibleStudents.filter(s => s.department === selectedDepartment);

        if (!videoRef.current || !canvasRef.current || studentsForScan.length === 0 || !videoRef.current.srcObject) {
            if (isScanning) logScan('No students with enrolled photos in this department.', 'info');
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
                students: studentsForScan.map(({registerNumber, name, profilePhotoUrl}) => ({registerNumber, name, profilePhotoUrl: profilePhotoUrl!}))
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

    }, [students, addAttendanceRecord, getTodaysRecordForStudent, toast, selectedDepartment, isScanning]);

    // Scanning loop
    useEffect(() => {
        if (isScanning && !studentsLoading && hasCameraPermission) {
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
    }, [isScanning, studentsLoading, hasCameraPermission, runScan]);
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

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
                    <Switch id="scan-toggle" checked={isScanning} onCheckedChange={setIsScanning} disabled={studentsLoading} />
                    <Label htmlFor="scan-toggle" className="text-lg">{isScanning ? "Scanning..." : "Scanner Off"}</Label>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-6">
                    <Card>
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
                        <CardContent className="space-y-3 h-[300px] overflow-y-auto">
                            {scanLog.length === 0 && (
                                <div className="text-center text-muted-foreground pt-8">
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

                <Card className="h-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Registered Students</CardTitle>
                                <CardDescription>Students in the selected department.</CardDescription>
                            </div>
                            {user?.department === 'all' && (
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="cs">Computer Science (CS)</SelectItem>
                                        <SelectItem value="ce">Civil Engineering (CE)</SelectItem>
                                        <SelectItem value="me">Mechanical Engineering (ME)</SelectItem>
                                        <SelectItem value="ee">Electrical Engineering (EE)</SelectItem>
                                        <SelectItem value="mce">Mechatronics (MCE)</SelectItem>
                                        <SelectItem value="ec">Electronics & Comm. (EC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departmentStudents.length > 0 ? departmentStudents.map((student) => {
                                        const record = getTodaysRecordForStudent(student.registerNumber, today);
                                        return (
                                        <TableRow key={student.registerNumber}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{student.name}</div>
                                                        <div className="text-sm text-muted-foreground">{student.registerNumber}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {record?.status === 'present' ? (
                                                    <Badge>
                                                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                                        Present
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">
                                                No students found for this department.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
