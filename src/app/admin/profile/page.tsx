
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';
import { Separator } from '@/components/ui/separator';

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
    const { user, loading: authLoading } = useAuth();
    const { institutionProfile, loading: profileLoading } = useInstitutionProfile();

    const collegeDetails = institutionProfile || {
        name: "Smart Institute",
        address: "123 Innovation Drive, Electronic City, Bengaluru",
        contact: "08221 - 226491 | Cell: +91 9886618231",
        email: "info@smartinstitute.edu",
        coverImageUrl: "https://picsum.photos/seed/college-campus/1920/1080"
    };

  const loading = authLoading || profileLoading;

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
        <p className="text-muted-foreground">Information about the college and your assigned department.</p>
      </div>

      <Card className='overflow-hidden shadow-lg'>
        <div className='relative h-48 w-full'>
            <Image 
                src={collegeDetails.coverImageUrl || "https://picsum.photos/seed/college-campus/1920/1080"}
                alt={`${collegeDetails.name} campus`}
                fill
                className='object-cover'
                data-ai-hint="college campus"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <CardHeader className="relative -mt-16 z-10 border-b-0 pb-4 px-6">
            <CardTitle className="font-headline text-3xl text-white">{collegeDetails.name}</CardTitle>
            <CardDescription className="text-white/90">
                {currentDepartment.name}
            </CardDescription>
        </CardHeader>
        <CardContent className='pt-8 space-y-8 px-6 pb-8'>
            {/* Section 1: Contact Details */}
            <div className='space-y-4'>
                <h3 className="text-lg font-semibold tracking-tight text-primary border-b pb-2">Contact Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                    <div className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <p className="font-semibold">{collegeDetails.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Phone className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                            <p className="font-semibold">{collegeDetails.contact}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Mail className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-semibold">{collegeDetails.email}</p>
                        </div>
                    </div>
                 </div>
            </div>

            <Separator />

            {/* Section 2: About Department */}
            <div className='space-y-4'>
                <h3 className="text-lg font-semibold tracking-tight text-primary border-b pb-2">About the Department</h3>
                <div className="flex items-start gap-4 pt-2">
                    <Info className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <p className="text-justify">{currentDepartment.about}</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
