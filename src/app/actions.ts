
"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Student, AttendanceRecord } from "@/lib/types";
import { dailyAttendanceReport, DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";
import { attendanceReportingWithFiltering, AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { chat, ChatInput } from "@/ai/flows/chatbot-flow";

const addStudentSchema = z.object({
  name: z.string(),
  registerNumber: z.string(),
  department: z.string(),
  email: z.string().email(),
  contact: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  photoDataUri: z.string(),
  dateOfBirth: z.string(), // Received as ISO string
});

export type AddStudentInput = z.infer<typeof addStudentSchema>;

const editStudentSchema = addStudentSchema.omit({ photoDataUri: true }).extend({
    photoDataUri: z.string().optional(),
});


export async function updateStudent(formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const validatedData = editStudentSchema.parse(data);
    
    // In a real app, you would handle the update in Firestore here.
    // For now, we simulate success.
    
    // If a new photo is uploaded, you might want to re-generate a face ID.
    if (validatedData.photoDataUri) {
      // const result = await faceDataTool(...);
    }
    
    return { success: true };
  } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        return { success: false, error: "Validation failed: " + error.message };
      }
      return { success: false, error: "An unexpected error occurred while updating the student." };
  }
}

// This is the type the client-side component provides
type GenerateDailyReportActionInput = {
    department: string;
    students: Student[];
    attendanceRecords: AttendanceRecord[];
}

export async function generateDailyReport(input: GenerateDailyReportActionInput) {
  try {
    // Sanitize student data to match flow schema (convert dates to strings)
    const sanitizedStudents = input.students.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      dateOfBirth: s.dateOfBirth.toISOString(),
      updatedAt: s.updatedAt?.toISOString() ?? s.createdAt.toISOString(),
    }));

    const sanitizedAttendance = input.attendanceRecords.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    const flowInput: DailyAttendanceReportInput = {
      department: input.department,
      students: sanitizedStudents,
      attendanceRecords: sanitizedAttendance,
    };

    const result = await dailyAttendanceReport(flowInput);
    return { success: true, fileUrl: result.fileUrl };
  } catch (error) {
    console.error("Error generating daily report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate report: ${errorMessage}` };
  }
}

type GenerateReportFormInput = {
    date: Date;
    department: string;
    students: Student[];
    attendanceRecords: AttendanceRecord[];
};

export async function generateReport(input: GenerateReportFormInput) {
    try {
        const dateStr = format(input.date, 'yyyy-MM-dd');
        
        // Sanitize student data to match flow schema (convert dates to strings)
        const sanitizedStudents = input.students.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          dateOfBirth: s.dateOfBirth.toISOString(),
          updatedAt: s.updatedAt?.toISOString() ?? s.createdAt.toISOString(),
        }));
        
        const sanitizedAttendance = input.attendanceRecords.map(r => ({
            ...r,
            timestamp: new Date(r.timestamp).toISOString(),
        }));

        const flowInput: AttendanceReportingWithFilteringInput = {
            startDate: dateStr,
            endDate: dateStr,
            department: input.department,
            students: sanitizedStudents,
            attendanceRecords: sanitizedAttendance
        };

        const result = await attendanceReportingWithFiltering(flowInput);
        return { success: true, fileUrl: result.fileUrl };
    } catch (error) {
        console.error("Error generating custom report:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate report: ${errorMessage}` };
    }
}


export async function handleChat(input: ChatInput) {
  try {
    const result = await chat(input);
    return { success: true, response: result.response };
  } catch (error) {
    console.error("Error in chat flow:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Chat failed: ${errorMessage}` };
  }
}
