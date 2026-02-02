
'use client';

import React from 'react';
import { ReportForm } from '@/components/admin/report-form';
import { TeacherReportForm } from '@/components/admin/teacher-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, History } from 'lucide-react';
import type { RecentExport } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STUDENT_EXPORTS_KEY = 'student_recent_exports';
const TEACHER_EXPORTS_KEY = 'teacher_recent_exports';

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [studentExports, setStudentExports] = React.useState<RecentExport[]>([]);
  const [teacherExports, setTeacherExports] = React.useState<RecentExport[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Load student exports
    const storedStudentExports = localStorage.getItem(STUDENT_EXPORTS_KEY);
    if (storedStudentExports) {
      const parsedExports = JSON.parse(storedStudentExports).map((exp: RecentExport) => ({
        ...exp,
        generatedAt: new Date(exp.generatedAt),
      }));
      setStudentExports(parsedExports);
    }
    // Load teacher exports
    const storedTeacherExports = localStorage.getItem(TEACHER_EXPORTS_KEY);
    if (storedTeacherExports) {
      const parsedExports = JSON.parse(storedTeacherExports).map((exp: RecentExport) => ({
        ...exp,
        generatedAt: new Date(exp.generatedAt),
      }));
      setTeacherExports(parsedExports);
    }
  }, []);
  
  const handleReportGenerated = (newExport: RecentExport) => {
    if (newExport.type === 'student') {
      setStudentExports(prevExports => {
        const updatedExports = [newExport, ...prevExports].slice(0, 5); // Keep last 5
        localStorage.setItem(STUDENT_EXPORTS_KEY, JSON.stringify(updatedExports));
        return updatedExports;
      });
    } else {
      setTeacherExports(prevExports => {
        const updatedExports = [newExport, ...prevExports].slice(0, 5); // Keep last 5
        localStorage.setItem(TEACHER_EXPORTS_KEY, JSON.stringify(updatedExports));
        return updatedExports;
      });
    }
  };
  
  const RecentExportsList = ({ exports, department }: { exports: RecentExport[], department?: string | 'all' }) => {
    const filteredExports = React.useMemo(() => {
      if (!department) return [];
      // Admins with 'all' should see everything; others see their dept + 'all' dept reports
      if (department === 'all') return exports;
      return exports.filter(exp => exp.department === department || exp.department === 'all');
    }, [exports, department]);

    return (
       <div className="space-y-4">
          {filteredExports.length > 0 ? (
          filteredExports.map((exp, index) => (
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

  if (loading || !isClient) {
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
          Export Reports
        </h1>
        <p className="text-foreground">
          Generate and download reports for students and teachers.
        </p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Student Attendance</TabsTrigger>
            <TabsTrigger value="teachers">Teacher List</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
             <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Generate Student Report</CardTitle>
                    <CardDescription>
                    Select a date and department to generate an attendance report.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportForm onReportGenerated={handleReportGenerated} />
                </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Student Exports</CardTitle>
                    <CardDescription>
                    Previously generated attendance reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentExportsList exports={studentExports} department={user?.department} />
                </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="teachers">
            <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Generate Teacher Report</CardTitle>
                    <CardDescription>
                    Select a department to generate a list of teachers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeacherReportForm onReportGenerated={handleReportGenerated} />
                </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Teacher Exports</CardTitle>
                    <CardDescription>
                    Previously generated teacher list reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentExportsList exports={teacherExports} department={user?.department} />
                </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
