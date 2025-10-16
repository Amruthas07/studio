import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockAttendance } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminAttendancePage() {
    const attendanceRecords = mockAttendance;

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
                    Attendance Log
                </h1>
                <p className="text-muted-foreground">
                    A complete history of all attendance records.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Records</CardTitle>
                    <CardDescription>Showing all recorded attendance entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Register No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.studentName}</TableCell>
                                    <TableCell>{record.studentRegister}</TableCell>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(record.status)} className="capitalize">{record.status}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{record.method}</TableCell>
                                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
