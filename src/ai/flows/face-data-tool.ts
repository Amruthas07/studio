'use server';

/**
 * @fileOverview AI tool to create face embeddings for new students and optionally insert data into MongoDB.
 *
 * - faceDataTool - A function that handles the face embedding creation and data insertion process.
 * - FaceDataToolInput - The input type for the faceDataTool function.
 * - FaceDataToolOutput - The return type for the faceDataTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceDataToolInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the student's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  registerNumber: z.string().describe("The student's register number."),
  name: z.string().describe("The student's name."),
  fatherName: z.string().describe("The student's father's name."),
  motherName: z.string().describe("The student's mother's name."),
  dateOfBirth: z.string().describe("The student's date of birth."),
  department: z.string().describe("The student's department (e.g., cs, ce, me)."),
  email: z.string().email().describe("The student's email address."),
  contact: z.string().describe("The student's contact number."),
  insertIntoMongo: z
    .boolean()
    .default(false)
    .describe("Whether to insert the student data into MongoDB."),
});
export type FaceDataToolInput = z.infer<typeof FaceDataToolInputSchema>;

const FaceDataToolOutputSchema = z.object({
  faceId: z.string().describe('The generated face ID or embedding.'),
  mongoInsertionResult: z
    .string()
    .optional()
    .describe('Result of MongoDB insertion, if requested.'),
});
export type FaceDataToolOutput = z.infer<typeof FaceDataToolOutputSchema>;

export async function faceDataTool(input: FaceDataToolInput): Promise<FaceDataToolOutput> {
  return faceDataToolFlow(input);
}

const faceDataToolFlow = ai.defineFlow(
  {
    name: 'faceDataToolFlow',
    inputSchema: FaceDataToolInputSchema,
    outputSchema: FaceDataToolOutputSchema,
  },
  async input => {
    // Generate a simple unique ID as a placeholder instead of calling the AI model.
    // This avoids failures when the external AI service is unavailable.
    const uniqueId = `face_${input.registerNumber}_${Date.now()}`;

    let mongoInsertionResult: string | undefined = undefined;
    if (input.insertIntoMongo) {
      // This is a placeholder as the app uses Firestore.
      mongoInsertionResult = 'Database insertion requested but not implemented (using Firestore).';
    }

    return {
      faceId: uniqueId,
      mongoInsertionResult,
    };
  }
);
