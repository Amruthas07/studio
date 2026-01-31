
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';

const departmentInfo = {
    cs: {
        name: "Computer Science & Engineering",
        about: "The Department of Computer Science is committed to excellence in teaching, research, and service. We offer a variety of programs to prepare students for successful careers in the ever-evolving field of technology."
    },
    ce: {
        name: "Civil Engineering",
        about: "The Department of Civil Engineering focuses on designing, constructing, and maintaining the physical and naturally built environment. Our curriculum prepares students for major infrastructure projects."
    },
    me: {
        name: "Mechanical Engineering",
        about: "The Department of Mechanical Engineering provides a broad scientific and technical background required to solve challenging problems in one of the most diverse fields of engineering."
    },
    ee: {
        name: "Electrical Engineering",
        about: "The Department of Electrical Engineering is dedicated to innovation in areas ranging from electronics to power systems, preparing students for the high-tech industry."
    },
    mce: {
        name: "Mechatronics",
        about: "The Mechatronics department integrates mechanical engineering with electronics and intelligent computer control to create smarter systems. Our students learn to design and build automated processes."
    },
    ec: {
        name: "Electronics & Communication",
        about: "The Department of Electronics & Communication Engineering covers the underlying principles of electronic devices and communication technologies, fostering innovation in a rapidly advancing field."
    }
};

export default function AdminProfilePage() {
    const { user, loading } = useAuth();

    const collegeDetails = {
        name: "SmartAttend Institute",
        address: "123 Innovation Drive, Electronic City, Bengaluru",
        contact: "+1 (800) 123-4567",
        email: "info@smartattend.edu",
        photoUrl: "https://picsum.photos/seed/college-building/1920/1080"
    };

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentDepartment = departmentInfo[user.department as keyof typeof departmentInfo] || {
      name: "Department",
      about: "Information about this department is not yet available."
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Institution Profile</h1>
        <p className="text-foreground">Information about the college and department.</p>
      </div>

      <Card className='overflow-hidden'>
        <div className='relative h-60 w-full'>
            <Image 
                src={collegeDetails.photoUrl}
                alt={`${collegeDetails.name} campus`}
                fill
                className='object-cover'
                data-ai-hint="college building"
                priority
            />
        </div>
        <CardHeader className="border-b">
            <CardTitle className="font-headline text-3xl">{collegeDetails.name}</CardTitle>
            <CardDescription>
                {currentDepartment.name}
            </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-semibold">{collegeDetails.address}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <Phone className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                    <p className="font-semibold">{collegeDetails.contact}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-semibold">{collegeDetails.email}</p>
                </div>
            </div>
             <div className="flex items-start gap-4 md:col-span-2">
                <Info className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">About the Department</p>
                    <p className="font-semibold text-justify">{currentDepartment.about}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
