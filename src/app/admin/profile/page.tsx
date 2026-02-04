'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Info, Loader2, University } from 'lucide-react';
import Image from 'next/image';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';
import { Separator } from '@/components/ui/separator';

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

    const aboutInstitution = "At Smart Institute, we are dedicated to fostering an environment of academic excellence and innovation. Our mission is to empower students with the knowledge, skills, and values needed to thrive in a rapidly changing world. We offer a diverse range of programs supported by a world-class faculty and state-of-the-art facilities. Our commitment to research, hands-on learning, and community engagement prepares our graduates to become leaders and problem-solvers in their chosen fields, making a positive impact on society.";

  const loading = authLoading || profileLoading;

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Institution Profile</h1>
        <p className="text-muted-foreground">General information about the college.</p>
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
                A Hub of Innovation and Academic Excellence
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

            {/* Section 2: About Institution */}
            <div className='space-y-4'>
                <h3 className="text-lg font-semibold tracking-tight text-primary border-b pb-2">About the Institution</h3>
                <div className="flex items-start gap-4 pt-2">
                    <University className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <p className="text-justify">{aboutInstitution}</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
