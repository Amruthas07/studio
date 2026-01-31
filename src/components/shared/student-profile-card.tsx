'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, Building, Briefcase, Hash, Cake, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Student } from '@/lib/types';

interface StudentProfileCardProps {
    student: Student;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function StudentProfileCard({ student }: StudentProfileCardProps) {
    if (!student) return null;

    const profileDetails = [
        { icon: Mail, label: 'Email', value: student.email },
        { icon: Phone, label: 'Contact', value: student.contact },
        { icon: Hash, label: 'Register No.', value: student.registerNumber },
        { icon: Briefcase, label: 'Department', value: <Badge variant="secondary" className="uppercase">{student.department}</Badge> },
        { icon: Cake, label: 'Date of Birth', value: format(new Date(student.dateOfBirth), "PPP") },
        { icon: User, label: "Father's Name", value: student.fatherName },
        { icon: User, label: "Mother's Name", value: student.motherName },
    ];

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-2 border-primary">
                        <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                        <AvatarFallback className="text-3xl">{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-3xl">{student.name}</CardTitle>
                        <CardDescription className="mt-1">
                            Enrolled on {new Date(student.createdAt).toLocaleDateString()}
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
