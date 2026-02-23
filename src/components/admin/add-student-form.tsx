
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, User, Info } from "lucide-react"
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
import { useStudents } from "@/hooks/use-students"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Firebase Auth requires 6 characters for passwords.
// Since registerNumber is the initial password, we enforce min(6).
const formSchema = z.object({
  name: z.string().min(2, "Name required."),
  registerNumber: z.string().min(6, "ID must be at least 6 characters (for security)."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  semester: z.coerce.number().min(1).max(8),
  email: z.string().email(),
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
    defaultValues: { name: "", registerNumber: "", email: "", contact: "", fatherName: "", motherName: "", semester: 1 },
  })
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
        const { photo, ...details } = values;
        // High-speed parallel pipeline
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
        console.error("Enrollment Exception:", e);
        toast({ variant: "destructive", title: "System Error", description: e.message || "An unexpected error occurred." });
    } finally {
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
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[75vh]">
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
                <div 
                    className="relative h-36 w-36 rounded-full overflow-hidden bg-secondary border-4 border-background shadow-2xl cursor-pointer group ring-4 ring-primary/10 hover:ring-primary/30 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
                            <User className="h-14 w-14 mb-1 opacity-20" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Add Photo</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-10 w-10 text-white" />
                    </div>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
                <div className="text-center">
                    <p className="text-xs font-black text-primary mb-1 uppercase tracking-tighter">WhatsApp-Style Square DP</p>
                    <p className="text-[10px] text-muted-foreground italic">Fast enrollment: photos are optimized to 400px instantly.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="registerNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Register Number</FormLabel>
                        <FormControl><Input placeholder="Min. 6 chars (e.g. 324CS210)" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="student@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact No.</FormLabel><FormControl><Input type="tel" placeholder="10 digits" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fatherName" render={({ field }) => (
                    <FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input placeholder="Guardian Name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="motherName" render={({ field }) => (
                    <FormItem><FormLabel>Mother's Name</FormLabel><FormControl><Input placeholder="Guardian Name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem className="flex flex-col md:col-span-2">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn("pl-3 text-left font-normal h-12", !field.value && "text-muted-foreground")}>
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
            
            <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-muted-foreground">
                    Enrollment creates a secure account for the student using their Register Number as the initial password.
                </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[160px] font-black uppercase tracking-widest shadow-lg">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enrolling...</> : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
