
'use client';

import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileImage, UserCheck, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/use-attendance';
import { useStudents } from '@/hooks/use-students';
import { getImageHash } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CameraAttendancePage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { attendanceRecords, addAttendanceRecord } = useAttendance();
  const { students } = useStudents();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB.',
        });
        return;
      }
      setPhotoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleMarkAttendance = async () => {
    if (!photoFile) {
        toast({ title: "Error", description: "Please upload a photo to mark attendance.", variant: "destructive"});
        return;
    }
    
    setIsProcessing(true);

    try {
        const currentHash = await getImageHash(photoFile);

        const matchedStudent = students.find(s => s.photoHash === currentHash);
        
        if (!matchedStudent) {
            throw new Error("No matching student found in the database. Please ensure the correct photo is used or that the student is enrolled.");
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

        // Reset form
        setPhotoFile(null);
        setPreviewUrl(null);

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
        <p className="text-muted-foreground">Upload a student's photo to mark their attendance for today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Photo Upload</CardTitle>
          <CardDescription>Upload a clear, recent photo of the student. The system will match it against enrolled photos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
             {previewUrl ? (
                <Image src={previewUrl} alt="Attendance photo preview" layout="fill" objectFit="contain" />
            ) : (
                <div className="text-center text-muted-foreground p-4 flex flex-col items-center gap-4">
                    <UploadCloud className="mx-auto h-16 w-16" />
                    <p className="mt-2 font-semibold">Upload a photo to mark attendance</p>
                    <p className="text-sm">The photo will be matched against the student database.</p>
                </div>
            )}
          </div>
          
           <Input
                id="attendance-photo"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="w-full max-w-sm file:text-primary file:font-semibold"
            />
            { !photoFile && <Alert><AlertDescription>Please select a photo to begin.</AlertDescription></Alert>}

            <Button 
                size="lg"
                onClick={handleMarkAttendance}
                disabled={!photoFile || isProcessing}
                className="w-full max-w-sm"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Matching...
                    </>
                ) : (
                    <>
                        <UserCheck />
                        Mark Attendance
                    </>
                )}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
