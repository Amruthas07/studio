
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
  photoHash: z.string().optional(), // updated
  createdAt: z.string(), 
  dateOfBirth: z.string(),
});

const AttendanceRecordSchema = z.object({
  id: z.string(),
  studentRegister: z.string(),
  studentName: z.string().optional(),
  date: z.string(),
  matched: z.boolean(), // updated
  timestamp: z.string(),
});

const MarkAttendanceFromCameraInputSchema = z.object({
  studentRegister: z
    .string()
    .describe("The student's register number."),
  date: z
    .string()
    .describe('The date of the attendance record in YYYY-MM-DD format.'),
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
    
    // Check if student register number exists in the student list
    const studentExists = input.students.some(s => s.registerNumber === input.studentRegister);
    if (!studentExists) {
        return {
            isValid: false,
            reason: 'Recognized student does not exist in the database.',
        }
    }

    return {
      isValid: true,
    };
  }
);


const markAttendanceFromCameraFlow = ai.defineFlow(
  {
    name: 'markAttendanceFromCameraFlow',
    inputSchema: MarkAttendanceFromCameraInputSchema,
    outputSchema: MarkAttendanceFromCameraOutputSchema,
  },
  async input => {
    // Directly call the validation tool instead of a prompt
    const validationResult = await checkAttendanceData(input);

    if (validationResult.isValid) {
      return {
        success: true,
        message: 'Attendance data is valid.'
      };
    } else {
      return {
        success: false,
        message: validationResult.reason || 'An unknown validation error occurred.'
      };
    }
  }
);
