
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, FileImage } from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  email: z.string().email(),
  contact: z.string().length(10, "Contact number must be exactly 10 digits."),
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
  const [isPending, startTransition] = React.useTransition()
  const { updateStudent } = useStudents();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(student.profilePhotoUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      department: student.department,
      email: student.email,
      contact: student.contact,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dateOfBirth: new Date(student.dateOfBirth),
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        const { photo, ...studentDetails } = values;

        await updateStudent(student.registerNumber, {
            ...studentDetails,
            dateOfBirth: values.dateOfBirth,
            newPhotoFile: photo,
        });
        
        onStudentUpdated();
    });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormItem>
                    <FormLabel>Register Number</FormLabel>
                    <FormControl>
                    <Input value={student.registerNumber} disabled />
                    </FormControl>
                    <FormDescription>Register number cannot be changed.</FormDescription>
                </FormItem>
            </div>
             <div className="space-y-2">
                <FormLabel>Profile Photo</FormLabel>
                <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Student preview" layout="fill" objectFit="cover" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <FileImage className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-xs">Upload new photo (optional)</p>
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
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                    <FileImage className="mr-2 h-4 w-4" /> Change Photo
                </Button>
            </div>
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
                    <FormItem className="flex flex-col">
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
                {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
