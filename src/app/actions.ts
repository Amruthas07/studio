"use server";

import { z } from "zod";
import { faceDataTool, type FaceDataToolInput } from "@/ai/flows/face-data-tool";
import { attendanceReportingWithFiltering, type AttendanceReportingWithFilteringInput } from "@/ai/flows/attendance-reporting-with-filtering";
import { dailyAttendanceReport, type DailyAttendanceReportInput } from "@/ai/flows/daily-attendance-report";

const addStudentSchema = z.object({
  name: z.string(),
  registerNumber: z.string(),
  department: z.string(),
  email: z.string().email(),
  contact: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  photo: z.instanceof(File),
  dateOfBirth: z.string(), // Received as ISO string
});

const editStudentSchema = addStudentSchema.omit({ photo: true }).extend({
    photo: z.instanceof(File).optional(),
});

const reportSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  department: z.string(),
  certainty: z.number().optional(),
});


export async function addStudent(formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const validatedData = addStudentSchema.parse(data);
    const dateOfBirth = new Date(validatedData.dateOfBirth);


    const photoFile = validatedData.photo;
    const photoBuffer = await photoFile.arrayBuffer();
    const photoBase64 = Buffer.from(photoBuffer).toString('base64');
    const photoDataUri = `data:${photoFile.type};base64,${photoBase64}`;

    const toolInput: FaceDataToolInput = {
      ...validatedData,
      dateOfBirth: dateOfBirth.toLocaleDateString(),
      photoDataUri,
      insertIntoMongo: true,
    };

    const result = await faceDataTool(toolInput);

    return { success: true, faceId: result.faceId };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
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

    if (validatedData.photo) {
        const photoFile = validatedData.photo;
        const photoBuffer = await photoFile.arrayBuffer();
        const photoBase64 = Buffer.from(photoBuffer).toString('base64');
        const photoDataUri = `data:${photoFile.type};base64,${photoBase64}`;
        (toolInput as FaceDataToolInput).photoDataUri = photoDataUri;

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
