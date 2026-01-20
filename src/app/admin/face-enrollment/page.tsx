
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Target, Sun, Smile, FileImage } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
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
import { Input } from '@/components/ui/input';
import { resizeAndCompressImage } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function FaceEnrollmentPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedPhotoDataUri, setProcessedPhotoDataUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { students, updateStudent, loading: studentsLoading } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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
              if(studentToEnroll.photoURL) {
                setPreviewUrl(studentToEnroll.photoURL)
              }
          }
      }
  }, [searchParams, students]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
              variant: "destructive",
              title: "File Too Large",
              description: "Please select an image smaller than 5MB.",
          });
          return;
      }

      setIsProcessing(true);
      setPreviewUrl(null);
      setProcessedPhotoDataUri(null);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      try {
        const compressedDataUri = await resizeAndCompressImage(file);
        setProcessedPhotoDataUri(compressedDataUri);
        toast({
            title: "Image Ready",
            description: "Image has been processed and is ready for enrollment.",
        });
      } catch (error) {
        console.error("Image processing failed:", error);
        toast({
            variant: "destructive",
            title: "No Face Detected",
            description: "Could not process the image. Please upload a clear, front-facing photo.",
        });
        setPreviewUrl(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

 const completeEnrollment = async () => {
    if (!selectedStudent || !processedPhotoDataUri) {
      toast({
        title: "Enrollment Failed",
        description: "Please select a student and upload a processed photo.",
        variant: "destructive"
      });
      return;
    }
    
    setIsEnrolling(true);
    setUploadProgress(0);
    setEnrollmentStep('Starting enrollment...');
    console.log("Starting enrollment...");
    
    const ENROLLMENT_TIMEOUT = 15000; // 15 seconds
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Enrollment timed out. Please check your network and try again.")), ENROLLMENT_TIMEOUT)
    );

    try {
        await Promise.race([
            updateStudent(
              selectedStudent.registerNumber,
              { newFacePhoto: processedPhotoDataUri },
              (progress) => {
                setUploadProgress(progress);
                if (progress < 100) {
                  setEnrollmentStep(`Uploading image: ${Math.round(progress)}%`);
                } else {
                  setEnrollmentStep('Saving face data...');
                }
                console.log(`Upload Progress: ${progress}%`);
              }
            ),
            timeoutPromise
        ]);
        
        toast({ 
          title: "Enrollment Successful!", 
          description: `${selectedStudent.name} has been successfully enrolled with the new face photo.`
        });
        router.push('/admin/students');

    } catch (error: any) {
        console.error("Enrollment failed:", error);
        toast({
            variant: "destructive",
            title: "Enrollment Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
        });
    } finally {
        setIsEnrolling(false);
        setEnrollmentStep('');
        setUploadProgress(0);
    }
  };
  
  const handleStudentSelect = (registerNumber: string) => {
    const student = students.find(s => s.registerNumber === registerNumber);
    setSelectedStudent(student || null);
    setPreviewUrl(student?.photoURL || null);
    setProcessedPhotoDataUri(null);
    router.replace(`/admin/face-enrollment?studentId=${registerNumber}`);
  };

  const guidelines = [
    { icon: Sun, title: "Good Lighting", text: "Use bright, even lighting. Avoid strong shadows or backlighting." },
    { icon: Target, title: "Clear Face", text: "Ensure the face is in focus, facing forward, and unobstructed." },
    { icon: Smile, title: "Neutral Expression", text: "A calm, neutral expression works best for recognition." },
    { icon: FileImage, title: "High Quality", text: "Upload a clear, high-resolution photo (JPG or PNG)." },
  ];

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
          <p className="text-muted-foreground">Upload a student's photo to enroll their face for attendance.</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Photo Guidelines</CardTitle>
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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Upload Photo</CardTitle>
                <CardDescription>Select a clear photo of the student's face.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-0">
               <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                {previewUrl ? (
                    <Image src={previewUrl} alt="Student preview" layout="fill" objectFit="contain" />
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <FileImage className="mx-auto h-12 w-12" />
                        <p className="mt-2">Image preview will appear here</p>
                    </div>
                )}
                 {isEnrolling && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="mt-4 font-semibold">{enrollmentStep}</p>
                        {uploadProgress > 0 && <Progress value={uploadProgress} className="w-3/4 mt-2 h-2" />}
                    </div>
                 )}
                 {isProcessing && !isEnrolling && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="mt-2">Processing image...</p>
                    </div>
                 )}
               </div>

                <Input
                    id="picture"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    disabled={!selectedStudent || isProcessing || isEnrolling}
                    className="w-full max-w-sm file:text-primary file:font-semibold"
                />
                 {!selectedStudent && <Alert variant="destructive"><AlertDescription>Please select a student before uploading a photo.</AlertDescription></Alert>}

            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button size="lg" className="w-full" onClick={completeEnrollment} disabled={isProcessing || isEnrolling || !processedPhotoDataUri || !selectedStudent}>
              {isEnrolling ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              {isEnrolling ? 'Enrolling...' : 'Complete Enrollment'}
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/admin/students')} disabled={isProcessing || isEnrolling}>
              <XCircle />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
