'use client';

import React from 'react';
import { TeacherAttendanceReportForm } from '@/components/teacher/teacher-attendance-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, History } from 'lucide-react';
import type { RecentExport } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEACHER_STUDENT_EXPORTS_KEY = 'teacher_student_recent_exports';

export default function TeacherReportsPage() {
  const { user, loading } = useAuth();
  const [studentExports, setStudentExports] = React.useState<RecentExport[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const storedStudentExports = localStorage.getItem(TEACHER_STUDENT_EXPORTS_KEY);
    if (storedStudentExports) {
      const parsedExports = JSON.parse(storedStudentExports).map((exp: RecentExport) => ({
        ...exp,
        generatedAt: new Date(exp.generatedAt),
      }));
      setStudentExports(parsedExports);
    }
  }, []);
  
  const handleReportGenerated = (newExport: RecentExport) => {
    setStudentExports(prevExports => {
        const updatedExports = [newExport, ...prevExports].slice(0, 5); // Keep last 5
        localStorage.setItem(TEACHER_STUDENT_EXPORTS_KEY, JSON.stringify(updatedExports));
        return updatedExports;
    });
  };
  
  const RecentExportsList = ({ exports }: { exports: RecentExport[]}) => {
    return (
       <div className="space-y-4">
          {exports.length > 0 ? (
          exports.map((exp, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div className='flex items-center gap-3'>
                  <FileDown className='h-5 w-5 text-muted-foreground' />
                  <div>
                  <p className='font-medium'>{exp.fileName}</p>
                  <p className='text-sm text-muted-foreground'>
                      Generated on {format(exp.generatedAt, "dd MMM yyyy 'at' hh:mm a")}
                  </p>
                  </div>
              </div>
              <Button asChild variant="outline" size="sm">
                  <a href={exp.url} download={exp.fileName} target="_blank" rel="noopener noreferrer">
                  Download
                  </a>
              </Button>
              </div>
          ))
          ) : (
          <div className="text-center text-muted-foreground py-8">
              <History className="mx-auto h-8 w-8" />
              <p className="mt-2">No recent exports.</p>
          </div>
          )}
      </div>
    );
  }

  if (loading || !isClient || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Export Attendance Reports
        </h1>
        <p className="text-foreground">
          Generate and download attendance reports for your department.
        </p>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
          <Card>
          <CardHeader>
              <CardTitle className="font-headline">Generate Report</CardTitle>
              <CardDescription>
              Select a date to generate a report for the {user.department.toUpperCase()} department.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <TeacherAttendanceReportForm onReportGenerated={handleReportGenerated} department={user.department} />
          </CardContent>
          </Card>
          <Card>
          <CardHeader>
              <CardTitle className="font-headline">Recent Exports</CardTitle>
              <CardDescription>
              Previously generated attendance reports.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <RecentExportsList exports={studentExports} />
          </CardContent>
          </Card>
      </div>
    </div>
  );
}
