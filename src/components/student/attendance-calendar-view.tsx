'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { AttendanceRecord } from '@/lib/types';
import { Badge } from '../ui/badge';

interface AttendanceCalendarViewProps {
    studentRecords: AttendanceRecord[];
}

export function AttendanceCalendarView({ studentRecords }: AttendanceCalendarViewProps) {
    const presentDays = studentRecords
        .filter(r => r.status === 'present' && !r.reason)
        .map(r => new Date(r.date + 'T00:00:00')); // Avoid timezone issues
    
    const absentDays = studentRecords
        .filter(r => r.status === 'absent')
        .map(r => new Date(r.date + 'T00:00:00'));

    const onLeaveDays = studentRecords
        .filter(r => r.status === 'present' && r.reason)
        .map(r => new Date(r.date + 'T00:00:00'));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Your attendance at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                 <Calendar
                    mode="multiple"
                    selected={[...presentDays, ...absentDays, ...onLeaveDays]}
                    modifiers={{
                        present: presentDays,
                        absent: absentDays,
                        onLeave: onLeaveDays,
                    }}
                    modifiersClassNames={{
                        present: 'day-present',
                        absent: 'day-absent',
                        onLeave: 'day-on-leave',
                    }}
                    className="p-0"
                    month={new Date()} // Show current month by default
                 />
                 <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500/80" />
                        <span className="text-sm">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500/80" />
                        <span className="text-sm">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-yellow-500/80" />
                        <span className="text-sm">On Leave</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
