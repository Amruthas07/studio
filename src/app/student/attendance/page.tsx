
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle } from "lucide-react";
import React from "react";
import { useAttendance } from "@/hooks/use-attendance";

export default function StudentAttendancePage() {
    const { user, loading } = useAuth();
    const { attendanceRecords } = useAttendance();
    
    if (loading || !user) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    
    const studentAttendanceRecords = attendanceRecords.filter(rec => rec.studentRegister === user.registerNumber);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    My Attendance
                </h1>
                <p className="text-muted-foreground">
                    Your complete attendance history.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Records</CardTitle>
                    <CardDescription>Showing all your recorded attendance entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentAttendanceRecords.length > 0 ? studentAttendanceRecords.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((record) => (
                                <TableRow key={record.id}>
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
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No attendance records found.
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
