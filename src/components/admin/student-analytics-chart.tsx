'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import type { Student } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface StudentAnalyticsChartProps {
    students: Student[];
}

export function StudentAnalyticsChart({ students }: StudentAnalyticsChartProps) {
    const data = useMemo(() => {
        const studentCounts = new Map<number, number>();

        students.forEach(student => {
            if (!student.createdAt) return;
            const monthStart = startOfMonth(new Date(student.createdAt)).getTime();
            studentCounts.set(monthStart, (studentCounts.get(monthStart) || 0) + 1);
        });

        if (studentCounts.size === 0) {
             const thisMonth = startOfMonth(new Date()).getTime();
             studentCounts.set(thisMonth, 0);
        }

        const sortedTimestamps = Array.from(studentCounts.keys()).sort((a, b) => a - b);
        
        return sortedTimestamps.map(ts => ({
            month: format(new Date(ts), 'MMM yyyy'),
            Students: studentCounts.get(ts) || 0,
        }));

    }, [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Students</CardTitle>
                <CardDescription>Monthly student enrollment trends.</CardDescription>
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
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
