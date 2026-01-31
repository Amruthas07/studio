'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import type { Teacher } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface TeacherAnalyticsChartProps {
    teachers: Teacher[];
}

export function TeacherAnalyticsChart({ teachers }: TeacherAnalyticsChartProps) {
    const data = useMemo(() => {
        const teacherCounts = new Map<number, number>();

        teachers.forEach(teacher => {
            if (!teacher.createdAt) return;
            const monthStart = startOfMonth(new Date(teacher.createdAt)).getTime();
            teacherCounts.set(monthStart, (teacherCounts.get(monthStart) || 0) + 1);
        });
        
        if (teacherCounts.size === 0) {
             const thisMonth = startOfMonth(new Date()).getTime();
             teacherCounts.set(thisMonth, 0);
        }

        const sortedTimestamps = Array.from(teacherCounts.keys()).sort((a, b) => a - b);

        return sortedTimestamps.map(ts => ({
            month: format(new Date(ts), 'MMM yyyy'),
            Teachers: teacherCounts.get(ts) || 0,
        }));

    }, [teachers]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Teacher Enrollment</CardTitle>
                <CardDescription>Monthly teacher enrollment trends.</CardDescription>
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
                            <Line type="monotone" dataKey="Teachers" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
