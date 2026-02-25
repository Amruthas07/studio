'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Info, Loader2, Building2 } from 'lucide-react';
import Image from 'next/image';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';

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

    const aboutInstitution = "JSS Polytechnic Nanjangud, established under JSS Mahavidyapeetha, is a premier technical institution approved by the Government of Karnataka and A.I.C.T.E., New Delhi. We are dedicated to providing high-quality technical education and training to empower students with skills that meet global industrial standards. Our state-of-the-art infrastructure and experienced faculty foster an environment of innovation and excellence.";

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
        <p className="text-foreground">General information about the college.</p>
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
        <CardContent className='pt-8 px-6 md:px-8 pb-8'>
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12 gap-8">
                <div className="lg:col-span-2 space-y-4">
                     <h3 className="text-xl font-semibold tracking-tight text-primary border-b-2 border-primary/30 pb-2 flex items-center gap-3">
                        <Info className="h-5 w-5" /> About the Institution
                    </h3>
                    <div className="pt-2">
                        <p className="text-justify text-foreground/90 leading-relaxed">{aboutInstitution}</p>
                        <p className="mt-4 font-semibold text-sm italic text-muted-foreground">Approved by Government of Karnataka and A.I.C.T.E. New Delhi</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold tracking-tight text-primary border-b-2 border-primary/30 pb-2 flex items-center gap-3">
                        <Building2 className="h-5 w-5" /> Contact Details
                    </h3>
                    <div className="space-y-5 pt-2">
                        <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p className="font-semibold">{collegeDetails.address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="font-semibold">{collegeDetails.contact}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Mail className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                <p className="font-semibold">{collegeDetails.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
