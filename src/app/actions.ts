"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Student, AttendanceRecord, Teacher } from "@/lib/types";
import { dailyAttendanceReport, DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";
import { attendanceReportingWithFiltering, AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { chat, ChatInput } from "@/ai/flows/chatbot-flow";
import { teacherListReport, TeacherListReportInput } from "@/ai/flows/teacher-list-report";


const addStudentSchema = z.object({
  name: z.string(),
  registerNumber: z.string(),
  department: z.string(),
  email: z.string().email(),
  contact: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  dateOfBirth: z.string(), // Received as ISO string
});

export type AddStudentInput = z.infer<typeof addStudentSchema>;

const editStudentSchema = addStudentSchema;


export async function updateStudent(formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const validatedData = editStudentSchema.parse(data);
    
    // Logic for updating student in Firestore would go here
    
    return { success: true };
  } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        return { success: false, error: "Validation failed: " + error.message };
      }
      return { success: false, error: "An unexpected error occurred while updating the student." };
  }
}

// Helper to safely format dates that might have been serialized to strings
const safeISOString = (date: any) => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    if (date?.toDate && typeof date.toDate === 'function') return date.toDate().toISOString();
    return new Date(date).toISOString();
};

// This is the type the client-side component provides
type GenerateDailyReportActionInput = {
    department: string;
    students: Student[];
    attendanceRecords: AttendanceRecord[];
}

export async function generateDailyReport(input: GenerateDailyReportActionInput) {
  try {
    const sanitizedStudents = input.students.map(s => ({
      ...s,
      createdAt: safeISOString(s.createdAt),
      dateOfBirth: safeISOString(s.dateOfBirth),
      updatedAt: s.updatedAt ? safeISOString(s.updatedAt) : safeISOString(s.createdAt),
    }));

    const sanitizedAttendance = input.attendanceRecords.map(r => ({
      ...r,
      timestamp: safeISOString(r.timestamp),
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
    statusFilter: "all" | "present" | "absent" | "on_leave";
    students: Student[];
    attendanceRecords: AttendanceRecord[];
};

export async function generateReport(input: GenerateReportFormInput) {
    try {
        const dateStr = format(input.date, 'yyyy-MM-dd');
        
        const sanitizedStudents = input.students.map(s => ({
          ...s,
          createdAt: safeISOString(s.createdAt),
          dateOfBirth: safeISOString(s.dateOfBirth),
          updatedAt: s.updatedAt ? safeISOString(s.updatedAt) : safeISOString(s.createdAt),
        }));
        
        const sanitizedAttendance = input.attendanceRecords.map(r => ({
            ...r,
            timestamp: safeISOString(r.timestamp),
        }));

        const flowInput: AttendanceReportingWithFilteringInput = {
            startDate: dateStr,
            endDate: dateStr,
            department: input.department,
            statusFilter: input.statusFilter,
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

type GenerateTeacherReportFormInput = {
    department: string;
    teachers: Teacher[];
};

export async function generateTeacherReport(input: GenerateTeacherReportFormInput) {
    try {
        const sanitizedTeachers = input.teachers.map(t => ({
          ...t,
          createdAt: safeISOString(t.createdAt),
          updatedAt: t.updatedAt ? safeISOString(t.updatedAt) : safeISOString(t.createdAt),
        }));

        const flowInput: TeacherListReportInput = {
            department: input.department,
            teachers: sanitizedTeachers,
        };

        const result = await teacherListReport(flowInput);
        return { success: true, fileUrl: result.fileUrl };
    } catch (error) {
        console.error("Error generating teacher report:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate report: ${errorMessage}` };
    }
}