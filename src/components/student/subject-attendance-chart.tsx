'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord } from '@/lib/types';
import type { AuthUser } from '@/contexts/auth-context';
import { getSubjects, Department, Semester } from '@/lib/subjects';

interface SubjectAttendanceChartProps {
  studentRecords: AttendanceRecord[];
  currentUser: AuthUser;
}

export function SubjectAttendanceChart({ studentRecords, currentUser }: SubjectAttendanceChartProps) {
    const chartData = React.useMemo(() => {
        if (!currentUser.department || !currentUser.semester || currentUser.department === 'all') {
            return [];
        }

        const subjects = getSubjects(currentUser.department as Department, currentUser.semester as Semester);
        
        return subjects.map(subject => {
            const subjectRecords = studentRecords.filter(r => r.subject === subject);
            const presentCount = subjectRecords.filter(r => r.status === 'present').length;
            const absentCount = subjectRecords.filter(r => r.status === 'absent').length;

            return {
                subject,
                present: presentCount,
                absent: absentCount,
            };
        });
    }, [studentRecords, currentUser]);

    if (chartData.length === 0) {
        return null; // Or some placeholder
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Subject-wise Attendance</CardTitle>
                <CardDescription>
                    Your attendance count (present vs. absent) for each subject this semester.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[350px] w-full'>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="subject"
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
                                allowDecimals={false}
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
                            <Bar dataKey="present" name="Present" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="absent" name="Absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
