
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User, Mail, Phone, Building, Briefcase, Hash, Cake, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StudentProfilePage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const profileDetails = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Contact', value: user.contact },
    { icon: Hash, label: 'Register No.', value: user.registerNumber },
    { icon: Briefcase, label: 'Department', value: <Badge variant="secondary" className="uppercase">{user.department}</Badge> },
    { icon: GraduationCap, label: 'Semester', value: user.semester },
    { icon: Cake, label: 'Date of Birth', value: format(new Date(user.dateOfBirth), "PPP") },
    { icon: User, label: "Father's Name", value: user.fatherName },
    { icon: User, label: "Mother's Name", value: user.motherName },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
        <p className="text-foreground">Your personal and academic information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
              <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-headline text-3xl">{user.name}</CardTitle>
              <CardDescription className="mt-1">
                Enrolled on {new Date(user.createdAt).toLocaleDateString()}
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
    </div>
  );
}
