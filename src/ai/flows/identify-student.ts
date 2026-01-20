
'use server';

/**
 * @fileOverview A Genkit flow for identifying a student from a live photo against a list of enrolled students.
 *
 * - identifyStudent - A function that handles the student identification process.
 * - IdentifyStudentInput - The input type for the identifyStudent function.
 * - IdentifyStudentOutput - The return type for the identifyStudent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnrolledStudentSchema = z.object({
  registerNumber: z.string().describe("The student's unique register number."),
  profilePhotoUrl: z.string().describe("The URL to the student's enrolled profile photo."),
});

export const IdentifyStudentInputSchema = z.object({
  livePhotoDataUri: z
    .string()
    .describe(
      "A live photo of a student, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  enrolledStudents: z
    .array(EnrolledStudentSchema)
    .describe('A list of students who are already enrolled with a profile photo.'),
});

export type IdentifyStudentInput = z.infer<typeof IdentifyStudentInputSchema>;

export const IdentifyStudentOutputSchema = z.object({
  matchedStudentRegister: z
    .string()
    .nullable()
    .describe(
      'The register number of the student with the highest confidence match. Null if no confident match is found.'
    ),
  confidence: z
    .number()
    .describe(
      'A confidence score between 0 and 1, representing the certainty of the match.'
    ),
});

export type IdentifyStudentOutput = z.infer<typeof IdentifyStudentOutputSchema>;

export async function identifyStudent(
  input: IdentifyStudentInput
): Promise<IdentifyStudentOutput> {
  return identifyStudentFlow(input);
}

const identifyStudentPrompt = ai.definePrompt({
    name: 'identifyStudentPrompt',
    input: { schema: IdentifyStudentInputSchema },
    output: { schema: IdentifyStudentOutputSchema },
    model: 'googleai/gemini-pro-vision',
    prompt: `You are an expert face identification system. Your task is to accurately identify a person from a live photo by comparing it against a database of enrolled student photos.

    Analyze the live photo provided:
    Live Photo: {{media url=livePhotoDataUri}}

    Now, compare the face in the live photo against each of the following enrolled students:
    {{#each enrolledStudents}}
    - Student Register Number: {{registerNumber}}, Photo: {{media url=profilePhotoUrl}}
    {{/each}}

    Follow these rules strictly:
    1.  Determine which enrolled student has the highest visual similarity to the person in the live photo.
    2.  Calculate a confidence score for this match, from 0.0 (no similarity) to 1.0 (identical person).
    3.  If the highest confidence score is below 0.75, you MUST consider it a low-confidence match. In this case, set 'matchedStudentRegister' to null and the confidence to the low score you calculated. Do not guess.
    4.  If the highest confidence score is 0.75 or higher, return the 'registerNumber' of that student and the calculated confidence score.
    5.  Focus only on facial features. Ignore differences in background, lighting, or clothing.

    Provide your response in the requested JSON format.
    `,
});

const identifyStudentFlow = ai.defineFlow(
  {
    name: 'identifyStudentFlow',
    inputSchema: IdentifyStudentInputSchema,
    outputSchema: IdentifyStudentOutputSchema,
  },
  async (input) => {
    if (input.enrolledStudents.length === 0) {
      return {
        matchedStudentRegister: null,
        confidence: 0,
      };
    }
    const {output} = await identifyStudentPrompt(input);
    return output!;
  }
);
