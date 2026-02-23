"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, User, Info } from "lucide-react"

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
import { useStudents } from "@/hooks/use-students"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// MIN 6 chars for registerNumber because Firebase Auth requires at least 6 characters for passwords
const formSchema = z.object({
  name: z.string().min(2, "Name required."),
  registerNumber: z.string().min(6, "Min. 6 chars required (used as password)."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  semester: z.coerce.number().min(1).max(8),
  email: z.string().email("Valid email required."),
  contact: z.string().length(10, "10 digits required."),
  fatherName: z.string().min(2, "Required."),
  motherName: z.string().min(2, "Required."),
  dateOfBirth: z.date({ required_error: "Required." }),
  photo: z.instanceof(File, { message: "Photo required." }),
})

export function AddStudentForm({ onStudentAdded }: { onStudentAdded: () => void }) {
  const { toast } = useToast()
  const { addStudent } = useStudents();
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
      semester: 1 
    },
  })
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
        const { photo, ...details } = values;
        const result = await addStudent(details, photo);
        
        if (result.success) {
            toast({ title: "Enrollment Success", description: `${values.name} has been registered.` });
            onStudentAdded();
            form.reset();
            setPreviewUrl(null);
        } else {
            toast({ variant: "destructive", title: "Enrollment Failed", description: result.error });
        }
    } catch (e: any) {
        console.error("Form Submission Error:", e);
        toast({ 
          variant: "destructive", 
          title: "System Error", 
          description: e.message || "An unexpected error occurred." 
        });
    } finally {
        // ALWAYS reset state to prevent button hang
        setIsSubmitting(false);
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File Too Large', description: 'Maximum 10MB allowed.' });
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
            <div className="flex items-center gap-6 py-4">
                <Avatar className="h-20 w-20 border shadow-sm">
                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                    <AvatarFallback className="bg-muted">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        <Camera className="mr-2 h-4 w-4" />
                        Select Photo
                    </Button>
                    <p className="text-[10px] text-muted-foreground">Standard 400px profile capture.</p>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. John Doe" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="registerNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Register Number</FormLabel>
                        <FormControl><Input placeholder="Min. 6 characters" {...field} disabled={isSubmitting} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
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
                )} />
                <FormField control={form.control} name="semester" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)} disabled={isSubmitting}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="student@example.com" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact No.</FormLabel><FormControl><Input type="tel" placeholder="10 digits" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fatherName" render={({ field }) => (
                    <FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input placeholder="Guardian Name" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="motherName" render={({ field }) => (
                    <FormItem><FormLabel>Mother's Name</FormLabel><FormControl><Input placeholder="Guardian Name" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem className="flex flex-col md:col-span-2">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    Register number serves as the student's ID and initial password (min. 6 characters required).
                </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[140px]">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enrolling...</> : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
