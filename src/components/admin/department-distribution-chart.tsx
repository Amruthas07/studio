'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import type { Student } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface DepartmentDistributionChartProps {
    students: Student[];
}

const departmentLabels: { [key: string]: string } = {
    cs: 'CS',
    ce: 'Civil',
    me: 'Mech',
    ee: 'Elec',
    mce: 'Mecha',
    ec: 'E&C',
};

export function DepartmentDistributionChart({ students }: DepartmentDistributionChartProps) {
    const data = useMemo(() => {
        const departmentCounts: { [key: string]: number } = {
            cs: 0, ce: 0, me: 0, ee: 0, mce: 0, ec: 0
        };

        students.forEach(student => {
            if (departmentCounts.hasOwnProperty(student.department)) {
                departmentCounts[student.department]++;
            }
        });

        return Object.entries(departmentCounts).map(([dept, count]) => ({
            department: departmentLabels[dept] || dept.toUpperCase(),
            Students: count,
        }));

    }, [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Student Distribution by Department</CardTitle>
                <CardDescription>Number of students in each department.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[350px] w-full'>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="department"
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
                            <Bar dataKey="Students" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
