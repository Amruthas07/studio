
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/use-attendance';
import { Loader2, CalendarIcon, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

export default function TeacherAttendanceRecordsPage() {
    const { user, loading: authLoading } = useAuth();
    const { attendanceRecords, loading: attendanceLoading } = useAttendance();
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

    const loading = authLoading || attendanceLoading;

    const filteredRecords = React.useMemo(() => {
        if (!selectedDate) {
            return attendanceRecords;
        }
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return attendanceRecords.filter(rec => rec.date === dateStr);
    }, [attendanceRecords, selectedDate]);

    if (loading || !user) {
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
                    Attendance Records
                </h1>
                <p className="text-foreground">
                    View daily attendance records for the <span className="font-bold uppercase">{user.department}</span> department.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Records for {selectedDate ? format(selectedDate, "PPP") : 'All Dates'}</CardTitle>
                    <CardDescription>A list of all attendance marked for the selected day.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>
                            {filteredRecords.length > 0 ? `${filteredRecords.length} record(s) found.` : 'No attendance records found for this date.'}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Register No.</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Marked By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.sort((a,b) => (a.studentName || '').localeCompare(b.studentName || '')).map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.studentName}</TableCell>
                                    <TableCell>{record.studentRegister}</TableCell>
                                    <TableCell>
                                        <Badge variant={record.reason ? 'secondary' : record.status === 'present' ? 'default' : 'destructive'} className="capitalize">
                                            {record.status === 'present' && !record.reason && <CheckCircle className='mr-2 h-4 w-4' />}
                                            {record.reason && <LogOut className='mr-2 h-4 w-4' />}
                                            {record.status === 'absent' && <XCircle className='mr-2 h-4 w-4' />}
                                            {record.reason ? 'On Leave' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{record.method === 'manual' ? record.markedBy : 'Face Scan'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
