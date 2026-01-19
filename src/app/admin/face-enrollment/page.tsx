
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Video, VideoOff, CheckCircle, XCircle, Target, Sun, Smile, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Student } from '@/lib/types';
import { useStudents } from '@/hooks/use-students';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FaceEnrollmentPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { students, updateStudent, loading: studentsLoading } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const departmentStudents = React.useMemo(() => {
    if (!user?.department || !students) return [];
    if (user.department === 'all') return students;
    return students.filter(s => s.department === user.department);
  }, [user, students]);
  
  useEffect(() => {
      const studentId = searchParams.get('studentId');
      if (studentId) {
          const studentToEnroll = students.find(s => s.registerNumber === studentId);
          if (studentToEnroll) {
              setSelectedStudent(studentToEnroll);
          }
      }
  }, [searchParams, students]);

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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (capturedImages.length >= 5) {
      toast({
        title: "Capture Limit Reached",
        description: "You can capture a maximum of 5 photos.",
        variant: "destructive"
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');
    setCapturedImages(prev => [...prev, photoDataUri]);
  };

 const completeEnrollment = async () => {
    if (!selectedStudent || capturedImages.length === 0) {
      toast({
        title: "Enrollment Failed",
        description: "Please select a student and capture at least one photo.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Pass all captured images to the update function
      await updateStudent(selectedStudent.registerNumber, { newFacePhotos: capturedImages });

      // Success toast is now handled within updateStudent, so we just navigate
      toast({ title: "Enrollment Complete!", description: `Redirecting to student list...` });
      router.push('/admin/students');

    } catch (error: any) {
      // The error toast (e.g., duplicate face) is already shown by updateStudent.
      // We just log it here for debugging and ensure the loading state is cleared.
      console.error("Enrollment failed:", error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleStudentSelect = (registerNumber: string) => {
    const student = students.find(s => s.registerNumber === registerNumber);
    setSelectedStudent(student || null);
    setCapturedImages([]);
    // Update URL without navigation to keep state
    router.replace(`/admin/face-enrollment?studentId=${registerNumber}`);
  };

  const guidelines = [
    { icon: Target, title: "Face Positioning", text: "Center your face within the frame with a neutral expression." },
    { icon: Sun, title: "Proper Lighting", text: "Ensure adequate lighting without harsh shadows." },
    { icon: Smile, title: "Clear Visibility", text: "Remove glasses, hats, or face coverings if possible." },
    { icon: UserCheck, title: "Multiple Captures", text: "Capture 3-5 photos from slightly different angles." },
  ];

  const qualityIndicators = ["Lighting", "Position", "Face Detection", "Clarity"];

  if (studentsLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Face Enrollment</h1>
          <p className="text-muted-foreground">Capture and enroll student faces for AI-powered attendance.</p>
        </div>
        <Select onValueChange={handleStudentSelect} value={selectedStudent?.registerNumber ?? ""}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a student to enroll" />
          </SelectTrigger>
          <SelectContent>
            {departmentStudents.map(student => (
              <SelectItem key={student.registerNumber} value={student.registerNumber}>
                {student.name} ({student.registerNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {guidelines.map(item => (
              <div key={item.title} className="flex items-start gap-4">
                <item.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
            <hr />
            <div>
              <h4 className="font-semibold mb-4">Image Quality Indicators</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {qualityIndicators.map(indicator => (
                  <div key={indicator} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                  {!isStreaming && (
                     <>
                        <Camera className="h-12 w-12 mb-4" />
                        <h3 className="font-bold">Camera not active</h3>
                        <p className="text-sm">
                          {!selectedStudent ? "Select a student to begin enrollment" : "Click 'Start Camera' to begin"}
                        </p>
                      </>
                  )}
                  {hasCameraPermission === false && (
                    <Alert variant="destructive"><AlertDescription>Camera access denied. Please enable in browser settings.</AlertDescription></Alert>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-4">
                <Button size="lg" variant={isStreaming ? "outline" : "default"} onClick={isStreaming ? stopCamera : startCamera} disabled={!selectedStudent}>
                  {isStreaming ? <VideoOff /> : <Video />}
                  {isStreaming ? 'Stop Camera' : 'Start Camera'}
                </Button>
                <Button size="lg" variant="secondary" onClick={capturePhoto} disabled={!isStreaming || capturedImages.length >= 5} className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Camera />
                  Capture Photo ({capturedImages.length}/5)
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Captured Images</CardTitle>
              {capturedImages.length > 0 && <Button variant="link" className="text-red-500" onClick={() => setCapturedImages([])}>Clear All</Button>}
            </CardHeader>
            <CardContent>
              {capturedImages.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {capturedImages.map((imgSrc, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image src={imgSrc} alt={`Capture ${index+1}`} layout="fill" objectFit="cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No images captured yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button size="lg" className="w-full" onClick={completeEnrollment} disabled={isProcessing || capturedImages.length === 0}>
              {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle />}
              Complete Enrollment
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/admin/students')}>
              <XCircle />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
