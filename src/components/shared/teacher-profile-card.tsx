
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Briefcase, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Teacher } from '@/lib/types';

interface TeacherProfileCardProps {
    teacher: Teacher;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function TeacherProfileCard({ teacher }: TeacherProfileCardProps) {
    if (!teacher) return null;

    const profileDetails = [
        { icon: Mail, label: 'Email', value: teacher.email },
        { icon: Briefcase, label: 'Department', value: <Badge variant="secondary" className="uppercase">{teacher.department}</Badge> },
        ...(teacher.position ? [{ icon: Award, label: 'Position', value: teacher.position }] : [])
    ];

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-2 border-primary">
                        <AvatarImage src={teacher.profilePhotoUrl} alt={teacher.name} />
                        <AvatarFallback className="text-3xl">{getInitials(teacher.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-3xl">{teacher.name}</CardTitle>
                        <CardDescription className="mt-1">
                            {teacher.position || 'Teacher'}, Joined on {new Date(teacher.createdAt).toLocaleDateString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
                    {profileDetails.map(detail => (
                        <div key={detail.label} className="flex items-start gap-4">
                            <detail.icon className="h-5 w-5 mt-1 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{detail.label}</p>
                                <div className="font-semibold">{detail.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
