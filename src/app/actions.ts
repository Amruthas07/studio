
"use server";

import { z } from "zod";
import { attendanceReportingWithFiltering, type AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { dailyAttendanceReport, type DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";
import { identifyStudent, type IdentifyStudentInput, type IdentifyStudentOutput } from "@/ai/flows/identify-student";
import type { Student, AttendanceRecord } from "@/lib/types";
import { fileToBase64 } from "@/lib/utils";

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

// Updated to expect a single date for daily roll call
const reportSchema = z.object({
  date: z.date(),
  department: z.string(),
});

// This is the data that will be passed from the client for generating reports
type GenerateReportClientInput = z.infer<typeof reportSchema> & {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
}

type GenerateDailyReportClientInput = {
    department: string;
    students: Student[];
    attendanceRecords: AttendanceRecord[];
}

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

export async function generateReport(values: GenerateReportClientInput) {
    try {
        // The flow expects the full data sets.
        const toolInput: AttendanceReportingWithFilteringInput = {
            startDate: values.date.toISOString().split('T')[0],
            endDate: values.date.toISOString().split('T')[0], // Keeping for schema consistency
            department: values.department,
            students: values.students.map(s => ({
                ...s, 
                createdAt: s.createdAt.toISOString(), 
                dateOfBirth: s.dateOfBirth.toISOString() 
            })),
            attendanceRecords: values.attendanceRecords,
        };

        const result = await attendanceReportingWithFiltering(toolInput);
        
        return { success: true, fileUrl: result.fileUrl };
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          return { success: false, error: "Validation failed: " + error.message };
        }
        return { success: false, error: "An unexpected error occurred while generating the report." };
    }
}

export async function generateDailyReport(values: GenerateDailyReportClientInput) {
    try {
        if (!values.department) {
            return { success: false, error: "Department is required." };
        }
        
        const toolInput: DailyAttendanceReportInput = {
            department: values.department,
            students: values.students.map(s => ({
                ...s, 
                createdAt: s.createdAt.toISOString(), 
                dateOfBirth: s.dateOfBirth.toISOString() 
            })),
            attendanceRecords: values.attendanceRecords,
        };

        const result = await dailyAttendanceReport(toolInput);
        
        return { success: true, fileUrl: result.fileUrl };
    } catch (error) {
        console.error(error);
        return { success: false, error: "An unexpected error occurred while generating the daily report." };
    }
}

export async function identifyStudentAction(formData: FormData): Promise<IdentifyStudentOutput> {
    const livePhoto = formData.get('livePhoto') as File;
    const enrolledStudentsData = formData.get('enrolledStudents') as string;
    
    if (!livePhoto || !enrolledStudentsData) {
        throw new Error("Missing required data for identification.");
    }
    
    try {
        const livePhotoDataUri = await fileToBase64(livePhoto);
        const enrolledStudents = JSON.parse(enrolledStudentsData);

        const flowInput: IdentifyStudentInput = {
            livePhotoDataUri,
            enrolledStudents,
        };
        
        const result = await identifyStudent(flowInput);
        return result;

    } catch (error: any) {
        console.error("Error in identifyStudentAction:", error);
        // Return a low-confidence result instead of throwing, to prevent client-side crashes
        return {
            matchedStudentRegister: null,
            confidence: 0,
        };
    }
}
