"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, User } from "lucide-react"
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
import type { Student } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  semester: z.coerce.number().min(1).max(8),
  email: z.string().email(),
  contact: z.string().length(10, "Contact number must be exactly 10 digits.").regex(/^[0-9]+$/, "Contact number must only contain digits."),
  fatherName: z.string().min(2, "Father's name is required."),
  motherName: z.string().min(2, "Mother's name is required."),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  photo: z.instanceof(File).optional()
    .refine(file => !file || file.size < 5 * 1024 * 1024, "Photo must be less than 5MB."),
})

type EditStudentFormProps = {
    student: Student;
    onStudentUpdated: () => void;
}

export function EditStudentForm({ student, onStudentUpdated }: EditStudentFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { updateStudent } = useStudents();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(student.profilePhotoUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      department: student.department,
      semester: student.semester,
      email: student.email,
      contact: student.contact,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dateOfBirth: new Date(student.dateOfBirth),
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const { dismiss } = toast({
        title: "Updating Student",
        description: values.photo ? "Optimizing new photo..." : "Saving changes...",
    });

    try {
        const { photo, ...studentDetails } = values;

        await updateStudent(student.registerNumber, {
            ...studentDetails,
            dateOfBirth: values.dateOfBirth,
            newPhotoFile: photo,
        });
        
        onStudentUpdated();
    } catch (e: any) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: e.message || "Could not save changes.",
        });
    } finally {
        setIsSubmitting(false);
        dismiss();
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('photo', file, { shouldValidate: true });
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
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
                        Change Photo
                    </Button>
                    <p className="text-[10px] text-muted-foreground">Upload to update the profile picture.</p>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                <FormItem>
                    <FormLabel>Register Number</FormLabel>
                    <FormControl>
                    <Input value={student.registerNumber} disabled />
                    </FormControl>
                    <FormDescription className="text-[10px]">Register number cannot be changed.</FormDescription>
                </FormItem>

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
                          <SelectItem value="ec">Electronics & Comm. (EC)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Semester</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                              <SelectItem key={sem} value={String(sem)}>{sem}</SelectItem>
                          ))}
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
                        <FormItem className="flex flex-col pt-2 md:col-span-2">
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
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 mt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
