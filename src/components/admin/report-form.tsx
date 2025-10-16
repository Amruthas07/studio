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
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { generateReport } from "@/app/actions"
import { DatePickerWithRange } from "../ui/date-picker"
import type { DateRange } from "react-day-picker"

const formSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec", "all"]),
  certainty: z.number().min(0).max(100).optional(),
})

export function ReportForm() {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: {
        from: date?.from,
        to: date?.to,
      },
      department: "all",
      certainty: 70,
    },
  })

  React.useEffect(() => {
    if (date?.from && date?.to) {
      form.setValue('dateRange', { from: date.from, to: date.to });
    }
  }, [date, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await generateReport(values)
      if (result.success && result.fileUrl) {
        toast({
          title: "Report Generated Successfully",
          description: "Your report is ready for download.",
          action: (
            <a href={result.fileUrl} target="_blank" rel="noopener noreferrer">
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date range</FormLabel>
                <DatePickerWithRange date={date} setDate={setDate} />
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
        
        <FormField
          control={form.control}
          name="certainty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certainty Threshold: {field.value}%</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={[field.value ?? 70]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                />
              </FormControl>
               <p className="text-sm text-muted-foreground">
                Include face scan matches with certainty above this value.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Generating...' : 'Generate Report'}
        </Button>
      </form>
    </Form>
  )
}
