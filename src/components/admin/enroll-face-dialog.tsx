
'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Video, VideoOff } from 'lucide-react';
import type { Student } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface EnrollFaceDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    student: Student | null;
    onFaceEnrolled: (photoDataUri: string) => void;
}

export function EnrollFaceDialog({ isOpen, onOpenChange, student, onFaceEnrolled }: EnrollFaceDialogProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && !isStreaming) {
            startCamera();
        } else if (!isOpen && isStreaming) {
            stopCamera();
        }

        // Cleanup on component unmount
        return () => {
            if (isStreaming) {
                stopCamera();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

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
                    description: 'Please enable camera permissions to enroll a face.',
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
            setHasCameraPermission(null);
        }
    };

    const captureAndSave = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoDataUri = canvas.toDataURL('image/jpeg');

        onFaceEnrolled(photoDataUri);
        setIsCapturing(false);
        stopCamera();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">
                        Enroll Face for {student?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Position the student's face in the center of the frame and capture the image. This will be used for attendance recognition.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                            {hasCameraPermission === false && (
                                <>
                                    <VideoOff className="h-12 w-12 mb-4" />
                                    <h3 className="font-bold">Camera Access Denied</h3>
                                    <p className="text-sm">Please allow camera access in your browser settings.</p>
                                </>
                            )}
                            {!isStreaming && hasCameraPermission !== false && (
                                <>
                                    <Camera className="h-12 w-12 mb-4" />
                                    <h3 className="font-bold">Camera is starting...</h3>
                                </>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {hasCameraPermission === false && (
                        <Alert variant="destructive" className="w-full">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                This feature requires camera access. Please update your browser settings.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isCapturing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={captureAndSave}
                        disabled={!isStreaming || isCapturing}
                    >
                        {isCapturing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Camera className="mr-2 h-4 w-4" />
                                Capture & Save
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
