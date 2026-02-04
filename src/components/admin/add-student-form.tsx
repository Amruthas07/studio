
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"

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
})

type AddStudentFormProps = {
    onStudentAdded: () => void;
}

const DEPARTMENT_LIMIT = 700;

export function AddStudentForm({ onStudentAdded }: AddStudentFormProps) {
  const { toast } = useToast()
  const { addStudent, students } = useStudents();
  
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
  
  function onSubmit(values: z.infer<typeof formSchema>) {
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

    onStudentAdded();
    toast({
        title: "Enrolling Student...",
        description: `Your request to enroll ${values.name} is being processed.`,
    });
    
    addStudent({
        ...values,
        dateOfBirth: values.dateOfBirth,
    }).then((result) => {
      if (result.success) {
          toast({
              title: "Enrollment Successful",
              description: `${values.name} has been added to the system.`,
          });
      } else {
          toast({
              variant: "destructive",
              title: "Enrollment Failed",
              description: result.error || "An unexpected error occurred.",
              duration: 9000,
          });
      }
    });

    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
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
          </div>
          <div className="md:col-span-2">
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
                <FormDescription>
                  The student will be automatically promoted after each semester.
                </FormDescription>
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

          <div className="md:col-span-2">
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
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enroll Student
          </Button>
        </div>
      </form>
    </Form>
  )
}
