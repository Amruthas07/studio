
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React from "react";
import { generateDailyReport } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAttendance } from "@/hooks/use-attendance";
import type { Student } from "@/lib/types";
import { useStudents } from "@/hooks/use-students";


export default function AdminAttendancePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { attendanceRecords, loading: attendanceLoading } = useAttendance();
    const { students, loading: studentsLoading } = useStudents();
    const [isDownloading, setIsDownloading] = React.useState(false);
   
    const handleDownloadDailyReport = async () => {
        if (!user?.department) return;

        setIsDownloading(true);
        // Pass all the required data to the action
        const result = await generateDailyReport({
            department: user.department,
            students: students,
            attendanceRecords: attendanceRecords,
        });
        setIsDownloading(false);

        if (result.success && result.fileUrl) {
             const fileName = `${user.department.toUpperCase()}_Daily_Report_${format(new Date(), "yyyy-MM-dd")}.csv`;
            toast({
              title: "Daily Report Generated",
              description: "Your daily attendance report is ready for download.",
               action: (
                <a href={result.fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Download</Button>
                </a>
              ),
            })
        } else {
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: result.error || "Could not generate the daily report.",
            });
        }
    }

    const departmentAttendance = React.useMemo(() => {
        if (!user?.department || studentsLoading) return [];
        const departmentStudentRegisters = new Set(
            students
                .filter(s => s.department === user.department)
                .map(s => s.registerNumber)
        );

        return attendanceRecords.filter(rec => departmentStudentRegisters.has(rec.studentRegister));
    }, [attendanceRecords, user?.department, students, studentsLoading]);

    if (authLoading || attendanceLoading || studentsLoading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Attendance Log
                    </h1>
                    <p className="text-muted-foreground">
                        A complete history of all attendance records for the {user.department.toUpperCase()} department.
                    </p>
                </div>
                <Button onClick={handleDownloadDailyReport} disabled={isDownloading || studentsLoading || attendanceLoading}>
                    {isDownloading ? <Loader2 className="animate-spin" /> : <FileDown />}
                    Download Today's Report
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Records for {user.department.toUpperCase()}</CardTitle>
                    <CardDescription>Showing all recorded attendance entries for your department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Register No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departmentAttendance.length > 0 ? departmentAttendance.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.studentName}</TableCell>
                                    <TableCell>{record.studentRegister}</TableCell>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={record.matched ? 'default' : 'destructive'} className="capitalize">
                                            {record.matched ? <CheckCircle className='mr-2 h-4 w-4' /> : null}
                                            {record.matched ? 'Present' : 'Absent'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No attendance records found for your department.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
