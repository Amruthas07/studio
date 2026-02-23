"use client"

import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Camera, User } from "lucide-react"
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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
import { useTeachers } from "@/hooks/use-teachers"
import { getSubjects, type Semester } from "@/lib/subjects"
import { Separator } from "../ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  position: z.enum(["Professor", "Associate Professor", "Assistant Professor", "HOD"]),
  photo: z.instanceof(File, { message: "A profile photo is required." }),
  subjects: z.object({
      '1': z.array(z.string()).optional(),
      '2': z.array(z.string()).optional(),
      '3': z.array(z.string()).optional(),
      '4': z.array(z.string()).optional(),
      '5': z.array(z.string()).optional(),
      '6': z.array(z.string()).optional(),
      '7': z.array(z.string()).optional(),
      '8': z.array(z.string()).optional(),
  }).optional(),
})

type AddTeacherFormProps = {
    onTeacherAdded: () => void;
}

const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function AddTeacherForm({ onTeacherAdded }: AddTeacherFormProps) {
  const { toast } = useToast()
  const { addTeacher } = useTeachers();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      subjects: {},
    },
  })
  
  const department = form.watch('department');

  useEffect(() => {
    // Reset subject selections when department changes
    form.resetField("subjects");
  }, [department, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
        const { photo, ...teacherDetails } = values;
        const result = await addTeacher(teacherDetails, photo);
        
        if (result.success) {
            toast({ title: 'Teacher Registered', description: `${values.name} has been added to the system.` });
            onTeacherAdded();
            form.reset();
            setPreviewUrl(null);
        } else {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: result.error || "An unexpected error occurred.",
            });
        }
    } catch (e: any) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "System Error",
            description: "Failed to complete registration.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File Too Large', description: 'Maximum 5MB allowed.' });
          return;
      }
      form.setValue('photo', file, { shouldValidate: true });
      setPreviewUrl(URL.createObjectURL(file));
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[70vh]">
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            <div className="flex items-center gap-6 py-4">
                <Avatar className="h-20 w-20 border">
                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                    <AvatarFallback><User className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Select Photo
                    </Button>
                    <p className="text-[10px] text-muted-foreground">Standard profile photo upload.</p>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teacher Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Smith" {...field} />
                        </FormControl>
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
                            <Input type="email" placeholder="teacher@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Initial Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Min. 6 characters" {...field} />
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
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="cs">Computer Science (CS)</SelectItem>
                            <SelectItem value="ce">Civil Engineering (CE)</SelectItem>
                            <SelectItem value="me">Mechanical Engineering (ME)</SelectItem>
                            <SelectItem value="ee">Electrical Engineering (EE)</SelectItem>
                            <SelectItem value="mce">Mechatronics (MCE)</SelectItem>
                            <SelectItem value="ec">Electronics & Comm. (EC)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Professor">Professor</SelectItem>
                                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                                <SelectItem value="HOD">Head of Department (HOD)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <Separator />
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Subject Assignments</h3>
                <p className="text-sm text-muted-foreground">Select the subjects this teacher will manage.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {semesters.map(sem => {
                    const subjectsForSemester = department ? getSubjects(department, sem as Semester) : [];
                    return (
                        <FormField
                            key={sem}
                            control={form.control}
                            name={`subjects.${sem}`}
                            render={() => (
                                <FormItem className="flex flex-col p-3 border rounded-md bg-muted/30">
                                    <FormLabel className="font-semibold text-xs mb-2">Semester {sem}</FormLabel>
                                    <div className="space-y-1">
                                    {subjectsForSemester.length > 0 ? (
                                        subjectsForSemester.map((subject) => (
                                            <FormField
                                                key={subject}
                                                control={form.control}
                                                name={`subjects.${sem}`}
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem key={subject} className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(subject)}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentSubjects = field.value || [];
                                                                        const newSubjects = checked
                                                                            ? [...currentSubjects, subject]
                                                                            : currentSubjects.filter((value) => value !== subject);
                                                                        field.onChange(newSubjects);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-xs font-normal">
                                                                {subject}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground italic">No subjects</p>
                                    )}
                                    </div>
                                </FormItem>
                            )}
                        />
                    )
                })}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 mt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                    </>
                ) : "Add Teacher"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
