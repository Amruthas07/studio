
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
import { generateReport } from "@/app/actions"
import type { RecentExport } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/use-students"
import { useAttendance } from "@/hooks/use-attendance"

const formSchema = z.object({
  date: z.date(),
  statusFilter: z.enum(["all", "present", "absent", "on_leave"]),
})

type ReportFormProps = {
    onReportGenerated: (exportData: RecentExport) => void;
    department: string;
}

export function TeacherAttendanceReportForm({ onReportGenerated, department }: ReportFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, loading: attendanceLoading } = useAttendance();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      statusFilter: "all",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!department || department === 'all') {
        toast({
            variant: "destructive",
            title: "Invalid Department",
            description: "Cannot generate report without a specific department.",
        });
        return;
    }

    startTransition(async () => {
      const reportValues = {
        date: values.date,
        department: department,
        statusFilter: values.statusFilter,
        students,
        attendanceRecords
      };

      const result = await generateReport(reportValues)
      if (result.success && result.fileUrl) {
        const fileName = `Students_${department.toUpperCase()}_${values.statusFilter.replace('_', '-').toUpperCase()}_Report_${format(values.date, "yyyy-MM-dd")}.csv`;
        
        const newExport: RecentExport = {
            fileName,
            generatedAt: new Date(),
            url: result.fileUrl,
            department: department,
            type: 'student'
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

  const isLoading = isPending || studentsLoading || attendanceLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Report Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-[240px] pl-3 text-left font-normal",
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
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="statusFilter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attendance Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status to filter" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
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
