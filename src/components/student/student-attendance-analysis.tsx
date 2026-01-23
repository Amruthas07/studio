'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { AttendanceRecord } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StudentAttendanceAnalysisProps {
  studentRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
}

export function StudentAttendanceAnalysis({ studentRecords, allRecords }: StudentAttendanceAnalysisProps) {
    const { percentage, totalDays, presentDays } = React.useMemo(() => {
        // Find all unique days someone in the entire institution had a record.
        const uniqueWorkingDays = new Set(allRecords.map(r => r.date)).size;

        // Find all unique days this student was present or on leave.
        const presentAndOnLeaveDays = new Set(
            studentRecords
                .filter(r => r.status === 'present') // 'On Leave' is also status 'present' but with a reason
                .map(r => r.date)
        ).size;
        
        if (uniqueWorkingDays === 0) {
            return { percentage: 100, totalDays: 0, presentDays: 0 };
        }

        const attendancePercentage = Math.round((presentAndOnLeaveDays / uniqueWorkingDays) * 100);

        return { percentage: attendancePercentage > 100 ? 100 : attendancePercentage, totalDays: uniqueWorkingDays, presentDays: presentAndOnLeaveDays };
    }, [studentRecords, allRecords]);

    const getStatus = () => {
        if (percentage >= 75) {
            return {
                indicatorColor: 'bg-green-500',
                textColor: 'text-green-600 dark:text-green-400',
                message: 'Excellent Attendance',
                Icon: CheckCircle2,
            };
        }
        if (percentage >= 45) {
            return {
                indicatorColor: 'bg-orange-500',
                textColor: 'text-orange-600 dark:text-orange-400',
                message: 'Good Attendance',
                Icon: TrendingUp,
            };
        }
        return {
            indicatorColor: 'bg-red-500',
            textColor: 'text-red-600 dark:text-red-500',
            message: 'Warning: Low Attendance',
            Icon: AlertTriangle,
        };
    };

    const { indicatorColor, textColor, message, Icon } = getStatus();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Attendance Analysis</CardTitle>
                <CardDescription>Your overall attendance performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", textColor)} />
                        <span className={cn("font-bold", textColor)}>{message}</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} indicatorClassName={indicatorColor} />
                <div className="text-sm text-muted-foreground">
                    You were present for{' '}
                    <span className="font-bold text-foreground">{presentDays}</span> of{' '}
                    <span className="font-bold text-foreground">{totalDays}</span> total working days.
                </div>
            </CardContent>
        </Card>
    );
}
