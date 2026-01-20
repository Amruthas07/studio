
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
  status: z.enum(['present', 'on_leave']),
  timestamp: z.string(),
  reason: z.string().optional(),
  method: z.enum(["face-scan", "manual", "live-photo"]),
  photoUrl: z.string().optional(),
});


const AttendanceReportingWithFilteringInputSchema = z.object({
  startDate: z
    .string()
    .describe('The date for the attendance report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report (will be same as start date).'),
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
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
    const presentStudentRegisters = new Set(
        todaysRecords
            .filter(r => r.status === 'present')
            .map(r => r.studentRegister)
    );
     const onLeaveStudentRegisters = new Set(
        todaysRecords
            .filter(r => r.status === 'on_leave')
            .map(r => r.studentRegister)
    );

    // 3. Create the roll call list
    const rollCall = departmentStudents.map(student => {
        const isPresent = presentStudentRegisters.has(student.registerNumber);
        const isOnLeave = onLeaveStudentRegisters.has(student.registerNumber);
        const attendanceRecord = todaysRecords.find(rec => rec.studentRegister === student.registerNumber);
        
        let status = 'Absent';
        if (isPresent) status = 'Present';
        if (isOnLeave) status = 'Absent (Leave)';
        
        let timestamp = 'N/A';
        let reason = 'N/A';
        let method = 'N/A';

        if (attendanceRecord) {
            timestamp = new Date(attendanceRecord.timestamp).toLocaleString();
            method = attendanceRecord.method;
            if (attendanceRecord.status === 'on_leave') {
                reason = attendanceRecord.reason || 'Not specified';
            }
        }

        return {
            "Register Number": student.registerNumber,
            "Student Name": student.name,
            "Department": student.department.toUpperCase(),
            "Date": reportDate,
            "Status": status,
            "Method": method,
            "Timestamp": timestamp,
            "Leave Reason": reason,
        };
    });

    // 4. Calculate summary
    const presentCount = rollCall.filter(s => s.Status === 'Present').length;
    const onLeaveCount = rollCall.filter(s => s.Status === 'Absent (Leave)').length;
    const absentCount = rollCall.length - presentCount - onLeaveCount;
    
    const summaryData = [
      { metric: `Report for Date`, value: reportDate },
      { metric: `Department`, value: input.department.toUpperCase() },
      { metric: 'Total Students', value: rollCall.length },
      { metric: 'Number of Students Present', value: presentCount },
      { metric: 'Number of Students Absent', value: absentCount + onLeaveCount },
      { metric: 'Number of Students On Leave', value: onLeaveCount },
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
