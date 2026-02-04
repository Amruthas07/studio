
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
  profilePhotoUrl: z.string(),
  email: z.string().email(),
  contact: z.string(),
  photoHash: z.string().optional(),
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
  method: z.enum(["face-scan", "manual"]),
  photoUrl: z.string().optional(),
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
            "Date": reportDate,
        };
        
        if (recordsForStudent.length === 0) {
            return {
                ...baseDetails,
                "Status": "Absent",
                "Method": "N/A",
                "Timestamp": "N/A",
                "Leave Reason": "N/A",
            };
        }

        recordsForStudent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const latestRecord = recordsForStudent[0];
        
        if (latestRecord.status === 'present') {
            return {
                ...baseDetails,
                "Status": latestRecord.reason ? 'On Leave' : 'Present',
                "Method": latestRecord.method,
                "Timestamp": new Date(latestRecord.timestamp).toLocaleString(),
                "Leave Reason": latestRecord.reason || 'N/A',
            };
        } else { // 'absent'
            return {
                ...baseDetails,
                "Status": 'Absent',
                "Method": latestRecord.method,
                "Timestamp": new Date(latestRecord.timestamp).toLocaleString(),
                "Leave Reason": latestRecord.reason || 'Not specified',
            };
        }
    });

    // 4. Filter by status
    const filteredRollCall = rollCall.filter(entry => {
        if (input.statusFilter === 'all') return true;
        if (input.statusFilter === 'present') return entry.Status === 'Present';
        if (input.statusFilter === 'absent') return entry.Status === 'Absent';
        if (input.statusFilter === 'on_leave') return entry.Status === 'On Leave';
        return true;
    });

    // 5. Calculate summary based on filtered data
    const summaryData = [
      { metric: `Report for Date`, value: reportDate },
      { metric: `Department`, value: input.department.toUpperCase() },
      { metric: `Status Filter`, value: input.statusFilter.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      { metric: 'Total Students Shown', value: filteredRollCall.length },
      { metric: 'Present', value: filteredRollCall.filter(s => s.Status === 'Present').length },
      { metric: 'On Leave', value: filteredRollCall.filter(s => s.Status === 'On Leave').length },
      { metric: 'Absent', value: filteredRollCall.filter(s => s.Status === 'Absent').length },
    ];
    const summaryCsv = convertToCSV(summaryData);
    
    // 6. Convert main data to CSV
    const rollCallCsv = convertToCSV(filteredRollCall.length > 0 ? filteredRollCall : [
        { "Message": "No students found matching the filters." }
    ]);

    // 7. Combine summary and main data
    const finalCsvData = `${summaryCsv}\r\n\r\n${rollCallCsv}`;

    // 8. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(finalCsvData)}`;

    return {fileUrl};
  }
);
