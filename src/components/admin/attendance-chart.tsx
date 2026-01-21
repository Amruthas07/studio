'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface AttendanceChartProps {
    data: {
        date: string;
        present: number;
        absent: number;
        onLeave: number;
    }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
    return (
        <div className='h-[350px] w-full'>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis
                        dataKey="date"
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
                        tickFormatter={(value) => `${value}`}
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
                    <Bar dataKey="present" fill="hsl(var(--chart-1))" name="Present" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="onLeave" fill="hsl(var(--chart-3))" name="On Leave" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="hsl(var(--destructive))" name="Absent" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
