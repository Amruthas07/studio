'use client';

import React from 'react';
import { ReportForm } from '@/components/admin/report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, History } from 'lucide-react';
import type { RecentExport } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [recentExports, setRecentExports] = React.useState<RecentExport[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const storedExports = localStorage.getItem('recent_exports');
    if (storedExports) {
      // Dates are stored as strings, so we need to convert them back
      const parsedExports = JSON.parse(storedExports).map((exp: RecentExport) => ({
        ...exp,
        generatedAt: new Date(exp.generatedAt),
      }));
      setRecentExports(parsedExports);
    }
  }, []);
  
  const handleReportGenerated = (newExport: RecentExport) => {
    setRecentExports(prevExports => {
      const updatedExports = [newExport, ...prevExports].slice(0, 5); // Keep last 5
      localStorage.setItem('recent_exports', JSON.stringify(updatedExports));
      return updatedExports;
    });
  };

  const filteredExports = React.useMemo(() => {
    if (!user?.department) return [];
    return recentExports.filter(exp => exp.department === user.department || exp.department === 'all');
  }, [recentExports, user]);

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
          Export Attendance Reports
        </h1>
        <p className="text-muted-foreground">
          Generate and download attendance reports for the {user?.department.toUpperCase()} department.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Generate New Report</CardTitle>
            <CardDescription>
              Select a date range and department to generate a report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportForm onReportGenerated={handleReportGenerated} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Exports</CardTitle>
            <CardDescription>
              Previously generated reports for your department.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Download</a>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <History className="mx-auto h-8 w-8" />
                  <p className="mt-2">No recent exports for this department.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
