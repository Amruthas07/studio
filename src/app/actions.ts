
"use server";

import { z } from "zod";
import { faceDataTool, type FaceDataToolInput } from "@/ai/flows/face-data-tool";
import { attendanceReportingWithFiltering, type AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { dailyAttendanceReport, type DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
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

type AddStudentInput = z.infer<typeof addStudentSchema>;

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


export async function addStudent(data: AddStudentInput) {
  try {
    const validatedData = addStudentSchema.parse(data);
    const dateOfBirth = new Date(validatedData.dateOfBirth);

    // 1. Generate face embedding
    const toolInput: FaceDataToolInput = {
      name: validatedData.name,
      registerNumber: validatedData.registerNumber,
      department: validatedData.department,
      email: validatedData.email,
      contact: validatedData.contact,
      fatherName: validatedData.fatherName,
      motherName: validatedData.motherName,
      photoDataUri: validatedData.photoDataUri,
      dateOfBirth: dateOfBirth.toLocaleDateString(),
      insertIntoMongo: false, // We are using Firestore, not MongoDB
    };

    const result = await faceDataTool(toolInput);
    
    if (!result.faceId) {
        throw new Error("Failed to generate a face ID for the student.");
    }

    // 2. Prepare student record for Firestore
    const studentToSave: Student = {
        name: validatedData.name,
        registerNumber: validatedData.registerNumber,
        department: validatedData.department as Student['department'],
        email: validatedData.email,
        contact: validatedData.contact,
        fatherName: validatedData.fatherName,
        motherName: validatedData.motherName,
        photoURL: validatedData.photoDataUri,
        dateOfBirth: dateOfBirth,
        faceId: result.faceId,
        createdAt: new Date(),
    };

    // 3. Save to Firestore
    const studentDocRef = doc(firestore, 'students', studentToSave.registerNumber);
    await setDoc(studentDocRef, studentToSave);

    return { success: true, student: studentToSave };

  } catch (error) {
    console.error("Error in addStudent action:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.message };
    }
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

    // In a real app, you would find and update the student in the database.
    // For this mock, we're just validating and returning success.
    // If a new photo is provided, a new face embedding would be generated.

    if (validatedData.photoDataUri) {
        (toolInput as FaceDataToolInput).photoDataUri = validatedData.photoDataUri;
        // Simulate getting a new face ID if photo is updated
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
