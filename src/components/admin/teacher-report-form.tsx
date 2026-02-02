
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { generateTeacherReport } from "@/app/actions"
import type { RecentExport } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { useTeachers } from "@/hooks/use-teachers"

const formSchema = z.object({
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec", "all"]),
})

type TeacherReportFormProps = {
    onReportGenerated: (exportData: RecentExport) => void;
}

export function TeacherReportForm({ onReportGenerated }: TeacherReportFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()
  const { teachers, loading: teachersLoading } = useTeachers();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department: "all",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const reportValues = {
        department: values.department,
        teachers, // Pass live data
      };

      const result = await generateTeacherReport(reportValues)
      if (result.success && result.fileUrl) {
        const fileName = `Teachers_${values.department.toUpperCase()}_Report_${format(new Date(), "yyyy-MM-dd")}.csv`;

        const newExport: RecentExport = {
            fileName,
            generatedAt: new Date(),
            url: result.fileUrl,
            department: values.department,
            type: 'teacher'
        };

        onReportGenerated(newExport);

        toast({
          title: "Report Generated Successfully",
          description: "Your report is ready for download.",
          action: (
            <a href={result.fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Download</Button>
            </a>
          ),
        })
      } else {
        toast({
          variant: "destructive",
          title: "Report Generation Failed",
          description: result.error || "An unknown error occurred.",
        })
      }
    })
  }

  const isLoading = isPending || teachersLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  <SelectItem value="all">All Departments</SelectItem>
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
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? 'Generating...' : 'Loading Data...'}
            </>
          ) : 'Generate Report'}
        </Button>
      </form>
    </Form>
  )
}
