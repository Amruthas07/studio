import { ReportForm } from '@/components/admin/report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, History } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Export Attendance Reports
        </h1>
        <p className="text-muted-foreground">
          Generate and download attendance reports in CSV/PDF format.
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
            <ReportForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Exports</CardTitle>
            <CardDescription>
              Previously generated reports available for download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className='flex items-center gap-3'>
                        <FileDown className='h-5 w-5 text-muted-foreground' />
                        <div>
                            <p className='font-medium'>CS_Dept_July_Report.csv</p>
                            <p className='text-sm text-muted-foreground'>Generated on 28 July 2024</p>
                        </div>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Download</a>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className='flex items-center gap-3'>
                        <FileDown className='h-5 w-5 text-muted-foreground' />
                        <div>
                            <p className='font-medium'>ME_Dept_July_Report.pdf</p>
                            <p className='text-sm text-muted-foreground'>Generated on 27 July 2024</p>
                        </div>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Download</a>
                </div>
                 <div className="text-center text-muted-foreground py-4">
                    <History className="mx-auto h-8 w-8" />
                    <p className="mt-2">No more recent exports.</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
