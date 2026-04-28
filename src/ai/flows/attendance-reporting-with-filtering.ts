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

const StudentSchema = z.object({
  registerNumber: z.string(),
  name: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  email: z.string().email(),
  contact: z.string(),
  createdAt: z.string(),
  dateOfBirth: z.string(),
  updatedAt: z.string().optional(),
});

const AttendanceRecordSchema = z.object({
  id: z.string(),
  studentRegister: z.string(),
  studentName: z.string().optional(),
  date: z.string(),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  status: z.enum(['present', 'absent']),
  timestamp: z.string(),
  reason: z.string().optional(),
  method: z.enum(["manual"]),
  subject: z.string().optional(),
});


const AttendanceReportingWithFilteringInputSchema = z.object({
  startDate: z
    .string()
    .describe('The date for the attendance report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report (will be same as start date).'),
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
  statusFilter: z.enum(["all", "present", "absent", "on_leave"]).describe("The status to filter the report by."),
  students: z.array(StudentSchema).describe("List of all students"),
  attendanceRecords: z.array(AttendanceRecordSchema).describe("List of all attendance records"),
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
    headers.map(h => `"${h}"`).join(','), // Quote headers
    ...data.map(row =>
      headers
        .map(fieldName => JSON.stringify(row[fieldName] ?? ''))
        .join(',')
    ),
  ];
  return csvRows.join('\r\n');
}

// Helper to format ISO string to Excel-friendly HH:mm:ss
function formatTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toTimeString().split(' ')[0]; // Returns HH:mm:ss
    } catch (e) {
        return "NO RECORD";
    }
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
      ? input.students
      : input.students.filter(s => s.department === input.department);
    
    // 2. Filter attendance records for the selected date
    const reportDate = input.startDate;
    const todaysRecords = input.attendanceRecords.filter(record => record.date === reportDate);
    
    // 3. Create the roll call list
    const rollCall = departmentStudents.map(student => {
        const recordsForStudent = todaysRecords.filter(
            rec => rec.studentRegister === student.registerNumber
        );

        const baseDetails = {
            "Register Number": student.registerNumber,
            "Student Name": student.name,
            "Department": student.department.toUpperCase(),
            "Attendance Date": reportDate,
        };
        
        if (recordsForStudent.length === 0) {
            return {
                ...baseDetails,
                "Status": "ABSENT",
                "Method": "SYSTEM DEFAULT",
                "Time Marked": "NO ENTRY",
                "Leave Reason": "N/A",
            };
        }

        // Sort to find the most recent record if multiple exist for different subjects
        recordsForStudent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const latestRecord = recordsForStudent[0];
        
        const timestamp = formatTime(latestRecord.timestamp);
        
        if (latestRecord.status === 'present') {
            return {
                ...baseDetails,
                "Status": latestRecord.reason ? 'ON LEAVE' : 'PRESENT',
                "Method": latestRecord.method.toUpperCase(),
                "Time Marked": timestamp,
                "Leave Reason": latestRecord.reason || 'N/A',
            };
        } else { // 'absent'
            return {
                ...baseDetails,
                "Status": 'ABSENT (MANUAL)',
                "Method": latestRecord.method.toUpperCase(),
                "Time Marked": timestamp,
                "Leave Reason": latestRecord.reason || 'N/A',
            };
        }
    });

    // 4. Filter by status
    const filteredRollCall = rollCall.filter(entry => {
        if (input.statusFilter === 'all') return true;
        if (input.statusFilter === 'present') return entry.Status === 'PRESENT';
        if (input.statusFilter === 'absent') return entry.Status.includes('ABSENT');
        if (input.statusFilter === 'on_leave') return entry.Status === 'ON LEAVE';
        return true;
    });

    // 5. Calculate summary based on filtered data
    const summaryData = [
      { "Report Statistic": `Generated For Date`, "Value": reportDate },
      { "Report Statistic": `Target Department`, "Value": input.department.toUpperCase() },
      { "Report Statistic": `Status Filter Applied`, "Value": input.statusFilter.toUpperCase() },
      { "Report Statistic": 'Total Students in List', "Value": filteredRollCall.length },
      { "Report Statistic": 'Total Present', "Value": filteredRollCall.filter(s => s.Status === 'PRESENT').length },
      { "Report Statistic": 'Total On Leave', "Value": filteredRollCall.filter(s => s.Status === 'ON LEAVE').length },
      { "Report Statistic": 'Total Absent', "Value": filteredRollCall.filter(s => s.Status.includes('ABSENT')).length },
    ];
    const summaryCsv = convertToCSV(summaryData);
    
    // 6. Convert main data to CSV
    const rollCallCsv = convertToCSV(filteredRollCall.length > 0 ? filteredRollCall : [
        { "Message": "No student records matched the current selection criteria." }
    ]);

    // 7. Combine summary and main data
    const finalCsvData = `ATTENDANCE SUMMARY REPORT\r\n${summaryCsv}\r\n\r\nDETAILED ROLL CALL LIST\r\n${rollCallCsv}`;

    // 8. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(finalCsvData)}`;

    return {fileUrl};
  }
);