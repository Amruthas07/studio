
'use server';

/**
 * @fileOverview A Genkit flow for exporting a daily attendance roll call, showing present and absent students.
 *
 * - attendanceReportingWithFiltering - A function that handles the attendance reporting process.
 * - AttendanceReportingWithFilteringInput - The input type for the attendanceReportingWithFiltering function.
 * - AttendanceReportingWithFilteringOutput - The return type for the attendanceReportingWith-filtering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getInitialAttendance, getInitialStudents } from '@/lib/mock-data';

const AttendanceReportingWithFilteringInputSchema = z.object({
  startDate: z
    .string()
    .describe('The date for the attendance report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report (will be same as start date).'),
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
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
    // These functions now pull from Firestore via the contexts, but we get them here.
    // In a real flow, you'd pass this data in or fetch it directly. For this project structure,
    // we must re-implement the logic within the flow.
    const mockAttendance = getInitialAttendance();
    const mockStudents = getInitialStudents();
    
    // 1. Filter students by department
    const departmentStudents = input.department === 'all'
      ? mockStudents
      : mockStudents.filter(s => s.department === input.department);
    
    // 2. Filter attendance records for the selected date
    const reportDate = input.startDate;
    const todaysRecords = mockAttendance.filter(record => record.date === reportDate);
    const presentStudentRegisters = new Set(
        todaysRecords
            .filter(r => r.status === 'present' || r.status === 'late')
            .map(r => r.studentRegister)
    );

    // 3. Create the roll call list
    const rollCall = departmentStudents.map(student => {
        const attendanceRecord = todaysRecords.find(rec => rec.studentRegister === student.registerNumber);
        
        let status = 'absent';
        let timestamp = 'N/A';
        let method = 'N/A';

        if (attendanceRecord) {
            status = attendanceRecord.status;
            timestamp = new Date(attendanceRecord.timestamp).toLocaleString();
            method = attendanceRecord.method;
        }

        return {
            "Register Number": student.registerNumber,
            "Student Name": student.name,
            "Department": student.department.toUpperCase(),
            "Date": reportDate,
            "Status": status,
            "Timestamp": timestamp,
            "Method": method
        };
    });

    // 4. Calculate summary
    const presentCount = rollCall.filter(s => s.Status === 'present' || s.Status === 'late').length;
    const absentCount = rollCall.length - presentCount;
    
    const summaryData = [
      { metric: `Report for Date`, value: reportDate },
      { metric: `Department`, value: input.department.toUpperCase() },
      { metric: 'Total Students', value: rollCall.length },
      { metric: 'Number of Students Present', value: presentCount },
      { metric: 'Number of Students Absent', value: absentCount },
    ];
    const summaryCsv = convertToCSV(summaryData);
    
    // 5. Convert main data to CSV
    const rollCallCsv = convertToCSV(rollCall.length > 0 ? rollCall : [
        { "Message": "No students found for this department." }
    ]);

    // 6. Combine summary and main data
    const finalCsvData = `${summaryCsv}\r\n\r\n${rollCallCsv}`;

    // 7. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(finalCsvData)}`;

    return {fileUrl};
  }
);
