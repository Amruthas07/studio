
'use server';

/**
 * @fileOverview A Genkit flow for exporting a daily attendance roll call for a specific department.
 *
 * - dailyAttendanceReport - A function that handles the daily attendance reporting process.
 * - DailyAttendanceReportInput - The input type for the dailyAttendanceReport function.
 * - DailyAttendanceReportOutput - The return type for the dailyAttendanceReport function.
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


const DailyAttendanceReportInputSchema = z.object({
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
  students: z.array(StudentSchema).describe("List of all students"),
  attendanceRecords: z.array(AttendanceRecordSchema).describe("List of all attendance records for the day"),
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
    // 1. Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // 2. Filter students by department
    const departmentStudents = input.department === 'all'
      ? input.students
      : input.students.filter(s => s.department === input.department);
    
    // 3. Filter attendance records for today
    const todaysRecords = input.attendanceRecords.filter(record => record.date === today);
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

    // 4. Create the roll call list
    const rollCall = departmentStudents.map(student => {
        const isPresent = presentStudentRegisters.has(student.registerNumber);
        const isOnLeave = onLeaveStudentRegisters.has(student.registerNumber);
        const attendanceRecord = todaysRecords.find(rec => rec.studentRegister === student.registerNumber);
        
        let status = 'Absent';
        if (isPresent) status = 'Present';
        if (isOnLeave) status = 'On Leave';

        let timestamp = 'N/A';
        let reason = 'N/A';

        if (attendanceRecord) {
            timestamp = new Date(attendanceRecord.timestamp).toLocaleString();
            if (attendanceRecord.status === 'on_leave') {
                reason = attendanceRecord.reason || 'Not specified';
            }
        }

        return {
            "Student Name": student.name,
            "Date": today,
            "Department": student.department.toUpperCase(),
            "Status": status,
            "Timestamp": timestamp,
            "Leave Reason": reason,
        };
    });

    // 5. Convert to CSV
    const csvData = convertToCSV(rollCall.length > 0 ? rollCall : [
        { "Message": "No students found for this department." }
    ]);
    
    // 6. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`;

    return {fileUrl};
  }
);
