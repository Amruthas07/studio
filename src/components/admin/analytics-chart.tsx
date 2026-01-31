'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import type { Student, Teacher } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AnalyticsChartProps {
    students: Student[];
    teachers: Teacher[];
}

export function AnalyticsChart({ students, teachers }: AnalyticsChartProps) {
    const data = useMemo(() => {
        const studentCounts: { [key: string]: number } = {};
        const teacherCounts: { [key: string]: number } = {};

        students.forEach(student => {
            if (!student.createdAt) return;
            const month = format(startOfMonth(new Date(student.createdAt)), 'MMM yyyy');
            studentCounts[month] = (studentCounts[month] || 0) + 1;
        });

        teachers.forEach(teacher => {
            if (!teacher.createdAt) return;
            const month = format(startOfMonth(new Date(teacher.createdAt)), 'MMM yyyy');
            teacherCounts[month] = (teacherCounts[month] || 0) + 1;
        });
        
        const allMonths = new Set([...Object.keys(studentCounts), ...Object.keys(teacherCounts)]);
        
        if (allMonths.size === 0) {
            const thisMonth = format(startOfMonth(new Date()), 'MMM yyyy');
            allMonths.add(thisMonth);
        }

        const sortedMonths = Array.from(allMonths).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedMonths.map(month => ({
            month,
            Students: studentCounts[month] || 0,
            Teachers: teacherCounts[month] || 0,
        }));

    }, [students, teachers]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Enrollment Analytics</CardTitle>
                <CardDescription>Monthly student and teacher enrollment trends.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[350px] w-full'>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                allowDecimals={false}
                                width={30}
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
                            <Line type="monotone" dataKey="Students" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6 }} dot={false} />
                            <Line type="monotone" dataKey="Teachers" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
