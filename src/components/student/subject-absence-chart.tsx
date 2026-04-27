'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord, Student } from '@/lib/types';
import { getSubjects, Department, Semester } from '@/lib/subjects';

interface SubjectAbsenceChartProps {
  studentRecords: AttendanceRecord[];
  student: Student;
}

export function SubjectAbsenceChart({ studentRecords, student }: SubjectAbsenceChartProps) {
    const chartData = React.useMemo(() => {
        if (!student.department || !student.semester) {
            return [];
        }

        const subjects = getSubjects(student.department as Department, student.semester as Semester);
        
        return subjects.map(subject => {
            const subjectRecords = studentRecords.filter(r => r.subject === subject);
            const absentCount = subjectRecords.filter(r => r.status === 'absent').length;

            return {
                subject,
                absences: absentCount,
            };
        }).filter(data => data.absences > 0);
    }, [studentRecords, student]);

    if (chartData.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-destructive">Absence Analytics</CardTitle>
                <CardDescription>
                    Number of missed classes per subject.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[250px] w-full'>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                            <YAxis type="category" dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Bar dataKey="absences" name="Missed Classes" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
