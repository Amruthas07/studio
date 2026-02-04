'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord } from '@/lib/types';
import type { AuthUser } from '@/contexts/auth-context';
import { getSubjects, Department, Semester } from '@/lib/subjects';

interface SubjectAttendanceChartProps {
  student: AuthUser;
  studentRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
}

export function SubjectAttendanceChart({ student, studentRecords, allRecords }: SubjectAttendanceChartProps) {
    const attendanceData = React.useMemo(() => {
        if (!student.department || !student.semester || student.department === 'all' || !allRecords) {
            return [];
        }
        
        const subjects = getSubjects(student.department as Department, student.semester as Semester);
        
        // 1. Get all unique days where attendance was taken.
        const allWorkingDayStrings = new Set(allRecords.map(r => r.date));

        // 2. Filter these working days to only include those since the student's enrollment.
        const enrollmentDayStart = new Date(student.createdAt);
        enrollmentDayStart.setHours(0, 0, 0, 0);

        const studentWorkingDays = Array.from(allWorkingDayStrings).filter(dateStr => {
            const recordDate = new Date(`${dateStr}T00:00:00`);
            return recordDate >= enrollmentDayStart;
        });

        const totalWorkingDays = studentWorkingDays.length;

        // 3. Find all unique days THIS student was present (including on leave).
        const presentAndOnLeaveDays = new Set(
            studentRecords
                .filter(r => r.status === 'present')
                .map(r => r.date)
        ).size;
        
        const absentDays = totalWorkingDays > presentAndOnLeaveDays ? totalWorkingDays - presentAndOnLeaveDays : 0;

        if (totalWorkingDays === 0) return [];
        
        // Since attendance is daily, days present/absent apply to all subjects for that day.
        return subjects.map(subject => ({
            subject,
            Present: presentAndOnLeaveDays,
            Absent: absentDays,
        }));

    }, [student, studentRecords, allRecords]);

    if (attendanceData.length === 0) {
        return null; // Don't render the chart if there's no data or config
    }

    const totalDaysRecorded = attendanceData.length > 0 ? attendanceData[0].Present + attendanceData[0].Absent : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Subject-wise Attendance</CardTitle>
                <CardDescription>
                    Breakdown of present vs. absent days for each subject this semester.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalDaysRecorded > 0 ? (
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={attendanceData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis type="category" dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} tickLine={false} axisLine={false}/>
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "14px"}} />
                                <Bar dataKey="Present" name="Days Present" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="Absent" name="Days Absent" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No attendance has been recorded for this semester yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
