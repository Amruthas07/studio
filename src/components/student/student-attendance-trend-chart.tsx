'use client';

import React from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isAfter, isBefore } from 'date-fns';

interface StudentAttendanceTrendChartProps {
  studentRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  enrollmentDate: Date;
}

export function StudentAttendanceTrendChart({ studentRecords, allRecords, enrollmentDate }: StudentAttendanceTrendChartProps) {
    const attendanceData = React.useMemo(() => {
        const today = new Date();
        const enrollment = new Date(enrollmentDate);

        // Ensure interval is valid
        if (isAfter(enrollment, today)) return [];

        const monthIntervals = eachMonthOfInterval({
            start: enrollment,
            end: today
        });
        
        const monthlyStats = new Map<string, { present: number, total: number }>();

        // Initialize map for all months in the interval
        monthIntervals.forEach(monthStart => {
            const monthKey = format(monthStart, 'yyyy-MM');
            monthlyStats.set(monthKey, { present: 0, total: 0 });
        });

        // Calculate total working days per month
        const allWorkingDayStrings = new Set(allRecords.map(r => r.date));
        allWorkingDayStrings.forEach(dateStr => {
            const recordDate = new Date(`${dateStr}T00:00:00`);
            if (isAfter(recordDate, enrollment) || format(recordDate, 'yyyy-MM-dd') === format(enrollment, 'yyyy-MM-dd')) {
                const monthKey = format(recordDate, 'yyyy-MM');
                if (monthlyStats.has(monthKey)) {
                    const current = monthlyStats.get(monthKey)!;
                    monthlyStats.set(monthKey, { ...current, total: current.total + 1 });
                }
            }
        });

        // Calculate present days per month for the student
        const presentDays = new Set(studentRecords.filter(r => r.status === 'present').map(r => r.date));
        presentDays.forEach(dateStr => {
            const recordDate = new Date(`${dateStr}T00:00:00`);
            const monthKey = format(recordDate, 'yyyy-MM');
            if (monthlyStats.has(monthKey)) {
                const current = monthlyStats.get(monthKey)!;
                monthlyStats.set(monthKey, { ...current, present: current.present + 1 });
            }
        });
        
        return Array.from(monthlyStats.entries()).map(([monthKey, stats]) => ({
            month: format(new Date(monthKey + '-02'), 'MMM yyyy'), // Use day 2 to avoid timezone issues
            'Attendance (%)': stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        }));

    }, [studentRecords, allRecords, enrollmentDate]);
    
    if (attendanceData.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Monthly Attendance Trend</CardTitle>
                <CardDescription>
                    Your attendance percentage over time.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[300px] w-full'>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}} />
                            <Line type="monotone" dataKey="Attendance (%)" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6 }} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
