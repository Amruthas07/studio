
"use server";

import { z } from "zod";
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
