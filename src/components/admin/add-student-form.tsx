
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

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
import { fileToBase64 } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"
import { generateFaceId } from "@/app/actions"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(1, "Register number is required."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  email: z.string().email(),
  contact: z.string().length(10, "Contact number must be exactly 10 digits."),
  fatherName: z.string().min(2, "Father's name is required."),
  motherName: z.string().min(2, "Mother's name is required."),
  photo: z.any().refine(file => file instanceof File, "Photo is required."),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
})

type AddStudentFormProps = {
    onStudentAdded: () => void;
}

export function AddStudentForm({ onStudentAdded }: AddStudentFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()
  const { addStudent } = useStudents();

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const photoDataUri = await fileToBase64(values.photo);

        const studentDataForFaceId = {
          ...values,
          dateOfBirth: values.dateOfBirth.toISOString(),
          photoDataUri: photoDataUri,
        };
        
        const faceIdResult = await generateFaceId(studentDataForFaceId);

        if (!faceIdResult.success || !faceIdResult.student) {
          throw new Error(faceIdResult.error || "Failed to generate Face ID.");
        }
        
        await addStudent(faceIdResult.student);

        toast({
          title: "Student Added Successfully",
          description: `${values.name} has been enrolled. The list will update automatically.`,
        });
        onStudentAdded();
        form.reset();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Failed to Add Student",
          description: errorMessage,
        })
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input placeholder="Any format is accepted" {...field} />
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
                name="photo"
                render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel>Student Photo</FormLabel>
                    <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                    </FormControl>
                    <FormDescription>Used for face recognition.</FormDescription>
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
                {isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
