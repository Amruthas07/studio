
'use server';

/**
 * @fileOverview A Genkit flow for exporting a list of teachers.
 *
 * - teacherListReport - A function that handles the teacher list export.
 * - TeacherListReportInput - The input type for the teacherListReport function.
 * - TeacherListReportOutput - The return type for the teacherListReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeacherSchema = z.object({
  teacherId: z.string(),
  name: z.string(),
  email: z.string().email(),
  department: z.enum(["cs", "ce", "me", "ee", "mce", "ec"]),
  profilePhotoUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});


const TeacherListReportInputSchema = z.object({
  department: z.string().describe('The department to generate the report for (e.g., cs, ce, me).'),
  teachers: z.array(TeacherSchema).describe("List of all teachers"),
});

export type TeacherListReportInput = z.infer<
  typeof TeacherListReportInputSchema
>;

const TeacherListReportOutputSchema = z.object({
  fileUrl: z.string().describe('The data URI of the generated CSV report.'),
});

export type TeacherListReportOutput = z.infer<
  typeof TeacherListReportOutputSchema
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

export async function teacherListReport(
  input: TeacherListReportInput
): Promise<TeacherListReportOutput> {
  return teacherListReportFlow(input);
}


const teacherListReportFlow = ai.defineFlow(
  {
    name: 'teacherListReportFlow',
    inputSchema: TeacherListReportInputSchema,
    outputSchema: TeacherListReportOutputSchema,
  },
  async input => {
    // 1. Filter teachers by department
    const departmentTeachers = input.department === 'all'
      ? input.teachers
      : input.teachers.filter(t => t.department === input.department);

    // 2. Format data for CSV
    const teacherDataForCsv = departmentTeachers.map(teacher => ({
        "Teacher ID": teacher.teacherId,
        "Name": teacher.name,
        "Email": teacher.email,
        "Department": teacher.department.toUpperCase(),
        "Joined On": new Date(teacher.createdAt).toLocaleDateString(),
    }));

    // 3. Convert to CSV
    const csvData = convertToCSV(teacherDataForCsv.length > 0 ? teacherDataForCsv : [
        { "Message": "No teachers found for this department." }
    ]);

    // 4. Create a data URI
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`;

    return {fileUrl};
  }
);
