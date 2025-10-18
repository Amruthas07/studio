'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getInitialAttendance } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import React from "react";

export default function StudentAttendancePage() {
    const { user, loading } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = React.useState(() => getInitialAttendance());
    
    if (loading || !user) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    
    const studentAttendanceRecords = attendanceRecords.filter(rec => rec.studentRegister === user.registerNumber);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'present': return 'default';
            case 'absent': return 'destructive';
            case 'late': return 'outline';
            default: return 'secondary';
        }
    };

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
                                <TableHead>Method</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentAttendanceRecords.length > 0 ? studentAttendanceRecords.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(record.status)} className="capitalize">{record.status}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{record.method}</TableCell>
                                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
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
