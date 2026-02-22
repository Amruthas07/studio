"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, User } from "lucide-react"
import Image from 'next/image'

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(1, "Register number is required."),
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

type AddStudentFormProps = {
    onStudentAdded: () => void;
}

const DEPARTMENT_LIMIT = 700;

export function AddStudentForm({ onStudentAdded }: AddStudentFormProps) {
  const { toast } = useToast()
  const { addStudent, students } = useStudents();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      registerNumber: "",
      email: "",
      contact: "",
      fatherName: "",
      motherName: "",
      semester: 1,
    },
  })
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
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

    setIsSubmitting(true);
    const { photo, ...details } = values;

    try {
        const result = await addStudent(details, photo);
        if (result.success) {
            toast({
                title: "Enrollment Successful",
                description: `${values.name} has been added to the system.`,
            });
            onStudentAdded();
            form.reset();
            setPreviewUrl(null);
        } else {
            toast({
                variant: "destructive",
                title: "Enrollment Failed",
                description: result.error || "An unexpected error occurred.",
            });
        }
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Failed to complete enrollment.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast({
              variant: 'destructive',
              title: 'File Too Large',
              description: 'Please select an image smaller than 5MB.',
          });
          return;
      }
      form.setValue('photo', file, { shouldValidate: true });
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[75vh]">
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
                <div 
                    className="relative h-32 w-32 rounded-full overflow-hidden bg-secondary border-4 border-background shadow-xl cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
                            <User className="h-12 w-12 mb-1 opacity-20" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Add Photo</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name="photo"
                    render={() => (
                        <FormItem>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <p className="text-xs text-muted-foreground text-center">Click circle to upload profile picture.<br/>Auto-resized for speed.</p>
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
              
                <FormField
                  control={form.control}
                  name="registerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Register Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Unique ID (e.g. 324CS21001)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Father's Full Name" {...field} />
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
                      <Input placeholder="Mother's Full Name" {...field} />
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
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Semester</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
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
                      <Input type="tel" placeholder="10-digit number" {...field} />
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
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal h-12",
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
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button type="submit" disabled={isSubmitting} size="lg" className="px-10">
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling Student...
                </>
            ) : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
