
"use client"

import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  position: z.enum(["Professor", "Associate Professor", "Assistant Professor", "HOD"]),
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    onTeacherAdded();
    toast({
        title: "Registering Teacher...",
        description: `Your request to register ${values.name} is being processed.`,
    });

    addTeacher(values).then((result) => {
      if (result.success) {
        toast({ title: 'Teacher Registered', description: `${values.name} can now log in.` });
      } else {
          toast({
              variant: "destructive",
              title: "Registration Failed",
              description: result.error || "An unexpected error occurred.",
              duration: 9000,
          });
      }
    });
    
    form.reset();
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Set initial password" {...field} />
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
                name="position"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a position" />
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
            <p className="text-sm text-muted-foreground">Assign subjects for each semester based on the selected department.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {semesters.map(sem => {
                const subjectsForSemester = department ? getSubjects(department, sem as Semester) : [];
                return (
                    <FormField
                        key={sem}
                        control={form.control}
                        name={`subjects.${sem}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Semester {sem}</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value?.length && "text-muted-foreground"
                                                )}
                                                disabled={!department}
                                            >
                                                <span className="truncate">
                                                    {field.value?.length
                                                        ? `${field.value.length} selected`
                                                        : "Select subjects"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search subjects..." />
                                            <CommandEmpty>No subjects found for this department.</CommandEmpty>
                                            <CommandGroup>
                                                {subjectsForSemester.map((subject) => (
                                                    <CommandItem
                                                        value={subject}
                                                        key={subject}
                                                        onSelect={() => {
                                                            const selected = field.value || [];
                                                            const isSelected = selected.includes(subject);
                                                            const newValue = isSelected
                                                                ? selected.filter((s) => s !== subject)
                                                                : [...selected, subject];
                                                            field.onChange(newValue);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value?.includes(subject) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {subject}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            })}
        </div>
            
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Teacher
            </Button>
        </div>
      </form>
    </Form>
  )
}
