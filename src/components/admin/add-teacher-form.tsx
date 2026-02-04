"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import Image from 'next/image';

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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  photo: z.instanceof(File, { message: "A profile photo is required." })
    .refine(file => file.size > 0, "A profile photo is required.")
    .refine(file => file.size < 5 * 1024 * 1024, "Photo must be less than 5MB."),
})

type AddTeacherFormProps = {
    onTeacherAdded: () => void;
}

export function AddTeacherForm({ onTeacherAdded }: AddTeacherFormProps) {
  const { toast } = useToast()
  const { addTeacher } = useTeachers();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    onTeacherAdded();
    toast({
        title: "Registering Teacher...",
        description: `Your request to register ${values.name} is being processed.`,
    });

    const { photo, ...teacherDetails } = values;
    addTeacher({ ...teacherDetails, photoFile: photo }).then((result) => {
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
    setPreviewUrl(null);
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
            </div>
            <div className="space-y-2">
                <FormLabel>Profile Photo</FormLabel>
                <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary border relative flex items-center justify-center">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Teacher preview" layout="fill" objectFit="cover" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <p className="mt-2 text-xs">Photo preview</p>
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
                    Upload Photo
                </Button>
            </div>
        </div>
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
                    <SelectItem value="ec">Electronics &amp; Comm. (EC)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
            
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
