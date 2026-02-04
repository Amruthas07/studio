
'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord } from '@/lib/types';
import type { AuthUser } from '@/contexts/auth-context';
import { getSubjects, Department, Semester } from '@/lib/subjects';

interface SubjectAbsenceChartProps {
  student: AuthUser;
  studentRecords: AttendanceRecord[];
}

export function SubjectAbsenceChart({ student, studentRecords }: SubjectAbsenceChartProps) {
    const absenceData = React.useMemo(() => {
        if (!student.department || !student.semester || student.department === 'all') {
            return [];
        }
        
        const subjects = getSubjects(student.department as Department, student.semester as Semester);
        
        // Find all unique days the student was marked absent.
        const absentDays = new Set(
            studentRecords
                .filter(r => r.status === 'absent')
                .map(r => r.date)
        ).size;
        
        // Since attendance is daily, being absent for a day means absent for all subjects on that day.
        return subjects.map(subject => ({
            subject,
            absences: absentDays
        }));

    }, [studentRecords, student]);

    if (absenceData.length === 0) {
        return null; // Don't render the chart if there's no data or config
    }

    const totalAbsences = absenceData.reduce((acc, curr) => acc + curr.absences, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Subject-wise Absence</CardTitle>
                <CardDescription>
                    Number of days absent for each subject in your current semester.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalAbsences > 0 ? (
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={absenceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                <Bar dataKey="absences" name="Days Absent" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No absences recorded for this semester's subjects. Great job!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
