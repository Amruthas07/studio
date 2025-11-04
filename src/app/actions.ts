
"use server";

import { z } from "zod";
import { faceDataTool, type FaceDataToolInput } from "@/ai/flows/face-data-tool";
import { attendanceReportingWithFiltering, type AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { dailyAttendanceReport, type DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";
import type { Student } from "@/lib/types";

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

const reportSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  department: z.string(),
  certainty: z.number().optional(),
});


export async function generateFaceId(data: Omit<AddStudentInput, 'photoDataUri'> & { photoDataUri: string }) {
  try {
    const dateOfBirth = new Date(data.dateOfBirth);

    const toolInput: FaceDataToolInput = {
      name: data.name,
      registerNumber: data.registerNumber,
      department: data.department,
      email: data.email,
      contact: data.contact,
      fatherName: data.fatherName,
      motherName: data.motherName,
      photoDataUri: data.photoDataUri,
      dateOfBirth: dateOfBirth.toLocaleDateString(),
      insertIntoMongo: false,
    };

    const result = await faceDataTool(toolInput);
    
    if (!result.faceId) {
        throw new Error("Failed to generate a face ID for the student.");
    }

    const studentToSave: Student = {
        name: data.name,
        registerNumber: data.registerNumber,
        department: data.department as Student['department'],
        email: data.email,
        contact: data.contact,
        fatherName: data.fatherName,
        motherName: data.motherName,
        photoURL: data.photoDataUri,
        dateOfBirth: dateOfBirth,
        faceId: result.faceId,
        createdAt: new Date(),
    };
    
    return { success: true, student: studentToSave };
  } catch (error) {
    console.error("Error in generateFaceId action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function updateStudent(formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const validatedData = editStudentSchema.parse(data);
    const dateOfBirth = new Date(validatedData.dateOfBirth);

    const toolInput = {
        ...validatedData,
        dateOfBirth: dateOfBirth.toLocaleDateString(),
        insertIntoMongo: true,
    };

    if (validatedData.photoDataUri) {
        (toolInput as FaceDataToolInput).photoDataUri = validatedData.photoDataUri;
        const result = await faceDataTool(toolInput as FaceDataToolInput);
        return { success: true, faceId: result.faceId };
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

export async function generateReport(values: z.infer<typeof reportSchema>) {
    try {
        const validatedData = reportSchema.parse(values);
        
        const toolInput: AttendanceReportingWithFilteringInput = {
            startDate: validatedData.dateRange.from.toISOString().split('T')[0],
            endDate: validatedData.dateRange.to.toISOString().split('T')[0],
            department: validatedData.department,
            certaintyThreshold: validatedData.certainty ? validatedData.certainty / 100 : undefined,
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

export async function generateDailyReport(department: string) {
    try {
        if (!department) {
            return { success: false, error: "Department is required." };
        }
        
        const toolInput: DailyAttendanceReportInput = {
            department,
        };

        const result = await dailyAttendanceReport(toolInput);
        
        return { success: true, fileUrl: result.fileUrl };
    } catch (error) {
        console.error(error);
        return { success: false, error: "An unexpected error occurred while generating the daily report." };
    }
}
