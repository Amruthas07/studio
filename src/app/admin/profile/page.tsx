'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Loader2, Building2, Globe } from 'lucide-react';
import Image from 'next/image';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';
import { Separator } from '@/components/ui/separator';

export default function AdminProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { institutionProfile, loading: profileLoading } = useInstitutionProfile();

    const collegeDetails = institutionProfile || {
        name: "JSS Polytechnic Nanjangud",
        address: "Nanjangud, Karnataka",
        contact: "08221-226491",
        email: "jsspn324@jsspn.org",
        coverImageUrl: "https://picsum.photos/seed/jss-poly/1920/1080"
    };

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
        <p className="text-foreground">Official details and contact information.</p>
      </div>

      <Card className='overflow-hidden shadow-lg border-border/50'>
        <div className='relative h-56 w-full'>
            <Image 
                src={collegeDetails.coverImageUrl || "https://picsum.photos/seed/jss-poly/1920/1080"}
                alt={`${collegeDetails.name} campus`}
                fill
                className='object-cover'
                data-ai-hint="university campus"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <CardHeader className="relative -mt-20 z-10 border-b-0 pb-4 px-6 md:px-8">
            <CardTitle className="font-headline text-4xl text-white drop-shadow-lg">{collegeDetails.name}</CardTitle>
            <CardDescription className="text-white/90 text-lg">
                JSS Mahavidyapeetha
            </CardDescription>
        </CardHeader>
        <CardContent className='pt-8 px-6 md:px-8 pb-12'>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Details Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b-2 border-primary/10 pb-3">
                        <Building2 className="h-6 w-6" />
                        <h3 className="text-xl font-bold tracking-tight">Contact Details</h3>
                    </div>
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                                <p className="font-bold text-foreground text-lg leading-tight">{collegeDetails.address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
                                <p className="font-bold text-foreground text-lg leading-tight">{collegeDetails.contact}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Mail className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                                <p className="font-bold text-foreground text-lg leading-tight">{collegeDetails.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accreditation Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b-2 border-primary/10 pb-3">
                        <Globe className="h-6 w-6" />
                        <h3 className="text-xl font-bold tracking-tight">Accreditation</h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-foreground font-semibold text-lg leading-snug">
                            Approved by Government of Karnataka and A.I.C.T.E. New Delhi
                        </p>
                        <p className="text-muted-foreground italic text-sm leading-relaxed">
                            Official Smart Attendance Portal for JSS Polytechnic Nanjangud students and faculty.
                        </p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
