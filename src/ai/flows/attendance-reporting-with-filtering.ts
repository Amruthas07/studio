'use server';

/**
 * @fileOverview A Genkit flow for exporting attendance records with filtering based on AI-determined certainty values.
 *
 * - attendanceReportingWithFiltering - A function that handles the attendance reporting process with filtering.
 * - AttendanceReportingWithFilteringInput - The input type for the attendanceReportingWithFiltering function.
 * - AttendanceReportingWithFilteringOutput - The return type for the attendanceReportingWithFiltering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { mockAttendance, mockStudents } from '@/lib/mock-data';
import type { AttendanceRecord, Student } from '@/lib/types';

const AttendanceReportingWithFilteringInputSchema = z.object({
  startDate: z
    .string()
    .describe('The start date for the attendance report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the attendance report (YYYY-MM-DD).'),
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
  certaintyThreshold: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe(
      'Optional: The minimum certainty value (0 to 1) for face detection matches to include in the report.'
    ),
});

export type AttendanceReportingWithFilteringInput = z.infer<
  typeof AttendanceReportingWithFilteringInputSchema
>;

const AttendanceReportingWithFilteringOutputSchema = z.object({
  fileUrl: z.string().describe('The data URI of the generated CSV report.'),
});

export type AttendanceReportingWithFilteringOutput = z.infer<
  typeof AttendanceReportingWithFilteringOutputSchema
>;

// Helper to convert array of objects to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(fieldName => JSON.stringify(row[fieldName] ?? ''))
        .join(',')
    ),
  ];
  return csvRows.join('\r\n');
}

export async function attendanceReportingWithFiltering(
  input: AttendanceReportingWithFilteringInput
): Promise<AttendanceReportingWithFilteringOutput> {
  return attendanceReportingWithFilteringFlow(input);
}

const attendanceReportingWithFilteringFlow = ai.defineFlow(
  {
    name: 'attendanceReportingWithFilteringFlow',
    inputSchema: AttendanceReportingWithFilteringInputSchema,
    outputSchema: AttendanceReportingWithFilteringOutputSchema,
  },
  async input => {
    
    // 1. Filter students by department
    const departmentStudents = input.department === 'all'
      ? mockStudents
      : mockStudents.filter(s => s.department === input.department);
    const departmentStudentRegisters = new Set(departmentStudents.map(s => s.registerNumber));
    
    // 2. Filter attendance records by date range and department
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    const filteredRecords = mockAttendance.filter(record => {
        const recordDate = new Date(record.date);
        const isStudentInDepartment = departmentStudentRegisters.has(record.studentRegister);
        const isDateInRange = recordDate >= startDate && recordDate <= endDate;
        // Placeholder for certainty check if it was available in mock data
        // const hasCertainty = input.certaintyThreshold ? (record.confidenceScore || 1) >= input.certaintyThreshold : true;
        return isStudentInDepartment && isDateInRange;
    });
    
    // 3. Convert to CSV
    const csvData = convertToCSV(filteredRecords);

    // 4. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`;

    return {fileUrl};
  }
);
