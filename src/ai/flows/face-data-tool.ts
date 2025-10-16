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
      "A photo of the student's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  registerNumber: z.string().describe("The student's register number."),
  name: z.string().describe("The student's name."),
  fatherName: z.string().describe("The student's father's name."),
  motherName: z.string().describe("The student's mother's name."),
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

const faceDataToolPrompt = ai.definePrompt({
  name: 'faceDataToolPrompt',
  input: {schema: FaceDataToolInputSchema},
  output: {schema: FaceDataToolOutputSchema},
  prompt: `You are an AI assistant specialized in generating face embeddings.

  Generate a unique face ID (embedding) for the given student photo. This ID will be used for face recognition in the attendance system.

  Student Information:
  Register Number: {{{registerNumber}}}
  Name: {{{name}}}
  Father's Name: {{{fatherName}}}
  Mother's Name: {{{motherName}}}
  Department: {{{department}}}
  Email: {{{email}}}
  Contact: {{{contact}}}

  Photo: {{media url=photoDataUri}}

  Output the generated face ID.
  `,
});

const faceDataToolFlow = ai.defineFlow(
  {
    name: 'faceDataToolFlow',
    inputSchema: FaceDataToolInputSchema,
    outputSchema: FaceDataToolOutputSchema,
  },
  async input => {
    const {output} = await faceDataToolPrompt(input);

    let mongoInsertionResult: string | undefined = undefined;
    if (input.insertIntoMongo) {
      // TODO: Implement the logic to save student data to a database.
      // This could involve making an HTTP call to a backend service or directly
      // using a database client if the environment supports it.
      // For now, this is a placeholder.
      mongoInsertionResult = 'Database insertion requested but not yet implemented';
    }

    return {
      faceId: output!.faceId,
      mongoInsertionResult,
    };
  }
);
