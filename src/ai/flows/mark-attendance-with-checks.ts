
'use server';

/**
 * @fileOverview Flow for marking attendance from camera input, with checks to ensure valid records.
 *
 * - markAttendanceFromCamera - A function that handles marking attendance with checks.
 * - MarkAttendanceFromCameraInput - The input type for the markAttendanceFromCamera function.
 * - MarkAttendanceFromCameraOutput - The return type for the markAttendanceFromCamera function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarkAttendanceFromCameraInputSchema = z.object({
  studentRegister: z
    .string()
    .describe("The student's register number."),
  date: z
    .string()
    .describe('The date of the attendance record in YYYY-MM-DD format.'),
  status: z
    .enum(['present', 'absent', 'late', 'unknown-face', 'manual'])
    .describe('The attendance status.'),
  markedBy: z
    .string()
    .describe('Identifier of who or what marked the attendance (admin email or camera).'),
  method: z
    .enum(['face-scan', 'manual'])
    .describe('The method used to mark attendance.'),
  timestamp: z
    .string()
    .describe('The timestamp of when the attendance was marked (ISO format).'),
  confidenceScore: z.number().describe('Confidence score of the face recognition match.'),
});

export type MarkAttendanceFromCameraInput = z.infer<
  typeof MarkAttendanceFromCameraInputSchema
>;

const MarkAttendanceFromCameraOutputSchema = z.object({
  success: z.boolean().describe('Whether the attendance was successfully recorded.'),
  message: z.string().describe('A message indicating the outcome.'),
});

export type MarkAttendanceFromCameraOutput = z.infer<
  typeof MarkAttendanceFromCameraOutputSchema
>;

export async function markAttendanceFromCamera(
  input: MarkAttendanceFromCameraInput
): Promise<MarkAttendanceFromCameraOutput> {
  return markAttendanceFromCameraFlow(input);
}

const checkAttendanceData = ai.defineTool(
  {
    name: 'checkAttendanceData',
    description: 'Checks the attendance data for validity.',
    inputSchema: MarkAttendanceFromCameraInputSchema,
    outputSchema: z.object({
      isValid: z.boolean().describe('Whether the attendance data is valid.'),
      reason: z.string().optional().describe('Reason for invalidity, if any.'),
    }),
  },
  async (input) => {
    // If the face is unknown, we still consider it "valid" to record,
    // but the confidence is low.
    if (input.status === 'unknown-face') {
        return { isValid: true };
    }
    
    if (input.confidenceScore < 0.7) {
      return {
        isValid: false,
        reason: 'Confidence score below threshold.',
      };
    }


    return {
      isValid: true,
    };
  }
);

const markAttendanceFromCameraPrompt = ai.definePrompt({
  name: 'markAttendanceFromCameraPrompt',
  tools: [checkAttendanceData],
  input: {schema: MarkAttendanceFromCameraInputSchema},
  output: {schema: MarkAttendanceFromCameraOutputSchema},
  prompt: `You are an attendance recording assistant.  You will receive attendance information that has already been processed by a face-scanning camera.  Use the checkAttendanceData tool to validate the data, and return a success or failure message appropriately.

Input Data: {{{JSON.stringify $}}}
`,
});

const markAttendanceFromCameraFlow = ai.defineFlow(
  {
    name: 'markAttendanceFromCameraFlow',
    inputSchema: MarkAttendanceFromCameraInputSchema,
    outputSchema: MarkAttendanceFromCameraOutputSchema,
  },
  async input => {
    const checkResult = await checkAttendanceData(input);

    if (!checkResult.isValid) {
      return {
        success: false,
        message: `Invalid attendance data: ${checkResult.reason || 'Unknown reason'}`,
      };
    }

    // Here, in a real implementation, you would save the attendance record to Firestore.
    // This is just a simulation.

    // const {output} = await markAttendanceFromCameraPrompt(input);

    return {
      success: true,
      message: 'Attendance successfully recorded (simulated).',
    };
  }
);
