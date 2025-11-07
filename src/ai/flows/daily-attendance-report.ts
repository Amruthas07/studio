'use server';

/**
 * @fileOverview A Genkit flow for exporting a daily attendance report for a specific department.
 *
 * - dailyAttendanceReport - A function that handles the daily attendance reporting process.
 * - DailyAttendanceReportInput - The input type for the dailyAttendanceReport function.
 * - DailyAttendanceReportOutput - The return type for the dailyAttendanceReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getInitialAttendance, getInitialStudents } from '@/lib/mock-data';

const DailyAttendanceReportInputSchema = z.object({
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
});

export type DailyAttendanceReportInput = z.infer<
  typeof DailyAttendanceReportInputSchema
>;

const DailyAttendanceReportOutputSchema = z.object({
  fileUrl: z.string().describe('The data URI of the generated CSV report.'),
});

export type DailyAttendanceReportOutput = z.infer<
  typeof DailyAttendanceReportOutputSchema
>;

export async function dailyAttendanceReport(
  input: DailyAttendanceReportInput
): Promise<DailyAttendanceReportOutput> {
  return dailyAttendanceReportFlow(input);
}

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


const dailyAttendanceReportFlow = ai.defineFlow(
  {
    name: 'dailyAttendanceReportFlow',
    inputSchema: DailyAttendanceReportInputSchema,
    outputSchema: DailyAttendanceReportOutputSchema,
  },
  async input => {
    const mockAttendance = getInitialAttendance();
    const mockStudents = getInitialStudents();
    // 1. Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // 2. Filter students by department
    const departmentStudents = mockStudents.filter(s => s.department === input.department);
    const departmentStudentRegisters = new Set(departmentStudents.map(s => s.registerNumber));
    
    // 3. Filter attendance records for today and the specified department
    const todaysDepartmentRecords = mockAttendance.filter(record => 
        record.date === today && departmentStudentRegisters.has(record.studentRegister)
    );

    // 4. Join student names
    const studentMap = new Map(mockStudents.map(s => [s.registerNumber, s.name]));
    const enhancedRecords = todaysDepartmentRecords.map(rec => ({
      ...rec,
      studentName: studentMap.get(rec.studentRegister) || 'Unknown Student',
    }));

    // 5. Convert to CSV
    const csvData = convertToCSV(enhancedRecords.length > 0 ? enhancedRecords : [
        { id: "N/A", studentRegister: "N/A", studentName: "No records found", date: today, status: "N/A", markedBy: "N/A", method: "N/A", timestamp: "N/A" }
    ]);
    
    // 6. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`;

    return {fileUrl};
  }
);
