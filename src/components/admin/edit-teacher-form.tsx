"use client"

import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

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
import type { Teacher } from "@/lib/types"
import { useTeachers } from "@/hooks/use-teachers"
import { getSubjects, type Semester } from "@/lib/subjects"
import { Separator } from "../ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
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

type EditTeacherFormProps = {
    teacher: Teacher;
    onTeacherUpdated: () => void;
}

const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function EditTeacherForm({ teacher, onTeacherUpdated }: EditTeacherFormProps) {
  const { updateTeacher } = useTeachers();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: teacher.name,
      department: teacher.department,
      position: teacher.position,
      subjects: teacher.subjects || {},
    },
  })
  
  const department = form.watch('department');

  useEffect(() => {
    if (department !== teacher.department) {
      form.resetField("subjects");
    }
  }, [department, form, teacher.department]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await updateTeacher(teacher.teacherId, values);
        onTeacherUpdated();
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not save teacher details.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[60vh]">
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teacher Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Smith" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input value={teacher.email} disabled />
                    </FormControl>
                    <FormDescription className="text-[10px]">Email cannot be changed.</FormDescription>
                </FormItem>
                <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                    <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                <p className="text-sm text-muted-foreground">Assign subjects for each semester.</p>
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
                                                                    disabled={isSubmitting}
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
