
'use server';

/**
 * @fileOverview A Genkit flow for recognizing a student's face from a photo.
 *
 * - recognizeStudent - A function that handles the face recognition process.
 * - FaceRecognitionInput - The input type for the recognizeStudent function.
 * - FaceRecognitionOutput - The return type for the recognizeStudent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentPhotoSchema = z.object({
  registerNumber: z.string(),
  name: z.string(),
  profilePhotoUri: z.string().describe("A data URI of the student's profile photo."),
});

const FaceRecognitionInputSchema = z.object({
  cameraPhotoUri: z.string().describe("A data URI of the photo captured from the camera."),
  students: z.array(StudentPhotoSchema).describe("A list of students to compare against."),
});

export type FaceRecognitionInput = z.infer<typeof FaceRecognitionInputSchema>;

const FaceRecognitionOutputSchema = z.object({
  matchStatus: z.enum(['MATCH', 'NO_MATCH', 'MULTIPLE_FACES', 'ERROR']),
  registerNumber: z.string().optional().describe('The register number of the matched student, if any.'),
  name: z.string().optional().describe('The name of the matched student, if any.'),
  error: z.string().optional().describe('Error message if the process failed.'),
});

export type FaceRecognitionOutput = z.infer<typeof FaceRecognitionOutputSchema>;

export async function recognizeStudent(input: FaceRecognitionInput): Promise<FaceRecognitionOutput> {
  return recognizeStudentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faceRecognitionPrompt',
  input: {schema: FaceRecognitionInputSchema},
  output: {schema: FaceRecognitionOutputSchema},
  prompt: `You are an expert facial recognition system. Your task is to identify a person in a captured photo by comparing it against a list of enrolled students.

- Main Photo to Identify:
{{media url=cameraPhotoUri}}

- Enrolled Students:
{{#each students}}
  - Student Name: {{this.name}}
  - Register Number: {{this.registerNumber}}
  - Reference Photo: {{media url=this.profilePhotoUri}}
{{/each}}

Analyze the main photo. Follow these rules strictly:
1. If the main photo does not contain a clear, single human face, respond with a 'matchStatus' of 'NO_MATCH'.
2. If the main photo contains multiple faces, respond with a 'matchStatus' of 'MULTIPLE_FACES'.
3. Compare the single face in the main photo against all the enrolled student reference photos.
4. If there is one and only one clear match, respond with a 'matchStatus' of 'MATCH' and provide the 'registerNumber' and 'name' of the matched student.
5. If there is no confident match, respond with a 'matchStatus' of 'NO_MATCH'.

Your response must be in the specified JSON format.`,
});

const recognizeStudentFlow = ai.defineFlow(
  {
    name: 'recognizeStudentFlow',
    inputSchema: FaceRecognitionInputSchema,
    outputSchema: FaceRecognitionOutputSchema,
  },
  async (input) => {
    if (input.students.length === 0) {
      return { matchStatus: 'NO_MATCH' };
    }

    try {
      const { output } = await prompt(input);
      return output!;
    } catch(e) {
      console.error("Error in face recognition flow:", e);
      return { matchStatus: 'ERROR', error: "The AI model failed to process the request." };
    }
  }
);
