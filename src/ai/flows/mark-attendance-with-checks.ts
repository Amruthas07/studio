
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
import type { Student } from '@/lib/types';

const StudentSchema = z.object({
  registerNumber: z.string(),
  name: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  photoURL: z.string(),
  email: z.string().email(),
  contact: z.string(),
  faceId: z.string().optional(),
  createdAt: z.date(),
  dateOfBirth: z.date(),
});


const AttendanceRecordSchema = z.object({
  id: z.string(),
  studentRegister: z.string(),
  studentName: z.string().optional(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'manual', 'unknown-face']),
  markedBy: z.string(),
  method: z.enum(['face-scan', 'manual']),
  timestamp: z.string(),
});

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
  existingRecords: z.array(AttendanceRecordSchema).describe('List of existing attendance records for the day.'),
  students: z.array(StudentSchema).describe("List of all students"),
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
    description: 'Checks the attendance data for validity, including checking for duplicates.',
    inputSchema: MarkAttendanceFromCameraInputSchema,
    outputSchema: z.object({
      isValid: z.boolean().describe('Whether the attendance data is valid.'),
      reason: z.string().optional().describe('Reason for invalidity, if any.'),
    }),
  },
  async (input) => {
    // Check for existing record for the same student on the same day
    const alreadyExists = input.existingRecords.some(
        record => record.studentRegister === input.studentRegister && record.date === input.date
    );

    if (alreadyExists) {
        return {
            isValid: false,
            reason: 'Attendance has already been marked for this student today.',
        };
    }

    if (input.status === 'unknown-face') {
        return { isValid: true, reason: 'Unknown face detected.' };
    }
    
    // Check if student register number exists in the student list
    const studentExists = input.students.some(s => s.registerNumber === input.studentRegister);
    if (!studentExists) {
        return {
            isValid: false,
            reason: 'Recognized student does not exist in the database.',
        }
    }

    // Check confidence score
    if (input.confidenceScore < 0.7) {
      return {
        isValid: false,
        reason: `Confidence score of ${input.confidenceScore.toFixed(2)} is below the 0.7 threshold.`,
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
  prompt: `You are an attendance recording assistant. You will receive attendance information.
Your task is to validate this data by calling the 'checkAttendanceData' tool with the provided input.

Based on the tool's response:
- If the tool returns 'isValid: true', you MUST respond with '{ success: true, message: "Attendance marked successfully." }'.
- If the tool returns 'isValid: false', you MUST respond with '{ success: false, message: <reason from tool> }', where <reason from tool> is the reason provided by the tool.

Do not add any other information to your response.

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
    const { output } = await markAttendanceFromCameraPrompt(input);
    if (!output) {
      return {
        success: false,
        message: 'Failed to get a response from the attendance validation service.',
      };
    }
    return output;
  }
);
