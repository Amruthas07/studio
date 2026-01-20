"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, FileImage, Camera } from "lucide-react"
import Image from 'next/image';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"
import type { Student } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(1, "Register number is required."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  email: z.string().email(),
  contact: z.string().length(10, "Contact number must be exactly 10 digits."),
  fatherName: z.string().min(2, "Father's name is required."),
  motherName: z.string().min(2, "Mother's name is required."),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  photo: z.instanceof(File, { message: "A profile photo is required." })
    .refine(file => file.size > 0, "A profile photo is required.")
    .refine(file => file.size < 5 * 1024 * 1024, "Photo must be less than 5MB."),
})

type AddStudentFormProps = {
    onStudentAdded: (newStudent: Student) => void;
}

const DEPARTMENT_LIMIT = 700;

export function AddStudentForm({ onStudentAdded }: AddStudentFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()
  const { addStudent, students } = useStudents();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      registerNumber: "",
      email: "",
      contact: "",
      fatherName: "",
      motherName: "",
    },
  })
  
  const closeCamera = React.useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  React.useEffect(() => {
    // Ensure camera is closed on unmount
    return () => {
        closeCamera();
    };
  }, [closeCamera]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
        const departmentStudentsCount = students.filter(
            (student) => student.department === values.department
        ).length;

        if (departmentStudentsCount >= DEPARTMENT_LIMIT) {
          toast({
            variant: "destructive",
            title: "Department Full",
            description: `The ${values.department.toUpperCase()} department has reached its limit of ${DEPARTMENT_LIMIT} students.`,
          });
          return;
        }
        
        addStudent(
            {
                ...values,
                dateOfBirth: values.dateOfBirth,
                photoFile: values.photo,
            },
            (newStudent) => {
                onStudentAdded(newStudent);
                form.reset();
                setPreviewUrl(null);
            }
        );
    });
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('photo', file, { shouldValidate: true });
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (isCameraOpen) {
          closeCamera();
      }
    }
  }
  
  const openCamera = async () => {
    form.setValue('photo', new File([], ""), { shouldValidate: false });
    setPreviewUrl(null);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setIsCameraOpen(true);
    } catch (error) {
        console.error("Error accessing camera:", error);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
        toast({ title: "Error", description: "Could not capture photo.", variant: "destructive"});
        return;
    };
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], "live_capture.jpg", { type: "image/jpeg" });
            form.setValue('photo', file, { shouldValidate: true });
            setPreviewUrl(URL.createObjectURL(file));
            closeCamera();
        }
    }, 'image/jpeg');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Student Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="registerNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Register Number</FormLabel>
                            <FormControl>
                                <Input placeholder="Unique ID" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <FormLabel>Profile Photo</FormLabel>
                    <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                        {previewUrl && !isCameraOpen ? (
                            <Image src={previewUrl} alt="Student preview" layout="fill" objectFit="contain" />
                        ) : isCameraOpen ? (
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <FileImage className="mx-auto h-12 w-12" />
                                <p className="mt-2 text-xs">Photo preview</p>
                            </div>
                        )}
                    </div>
                     
                    <FormField
                        control={form.control}
                        name="photo"
                        render={() => (
                           <FormItem>
                                <FormControl>
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </FormControl>
                                <FormMessage />
                           </FormItem>
                        )}
                    />
                    {isCameraOpen ? (
                         <div className="flex gap-2">
                            <Button type="button" onClick={handleCapture} className="w-full">
                                <Camera className="mr-2 h-4 w-4" /> Capture
                            </Button>
                            <Button type="button" variant="outline" onClick={closeCamera} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <FileImage className="mr-2 h-4 w-4" /> Upload File
                            </Button>
                            <Button type="button" variant="secondary" onClick={openCamera} className="w-full">
                                <Camera className="mr-2 h-4 w-4" /> Use Camera
                            </Button>
                        </div>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mother's Name</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="cs">Computer Science (CS)</SelectItem>
                        <SelectItem value="ce">Civil Engineering (CE)</SelectItem>
                        <SelectItem value="me">Mechanical Engineering (ME)</SelectItem>
                        <SelectItem value="ee">Electrical Engineering (EE)</SelectItem>
                        <SelectItem value="mce">Mechatronics (MCE)</SelectItem>
                        <SelectItem value="ec">Electronics &amp; Comm. (EC)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                        <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel>Date of birth</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                captionLayout="dropdown-buttons"
                                fromYear={1950}
                                toYear={new Date().getFullYear() - 10}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
