
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Mail, MapPin, Phone, Info } from 'lucide-react';
import Image from 'next/image';

export default function AdminProfilePage() {
    const collegeDetails = {
        name: "SMART ATTENDANCE SYSTEM University",
        address: "Mysore-Ooty Road, Nanjangud",
        contact: "08221 - 22649 / +91 988661823",
        email: "jsspn324@gmail.com",
        about: "The Department of Computer Science is committed to excellence in teaching, research, and service. We offer a variety of programs to prepare students for successful careers in the ever-evolving field of technology.",
        photoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
    };


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Institution Profile</h1>
        <p className="text-muted-foreground">Information about the college and department.</p>
      </div>

      <Card className='overflow-hidden'>
        <div className='relative h-48 w-full'>
            <Image 
                src={collegeDetails.photoUrl}
                alt={`${collegeDetails.name} campus`}
                fill
                className='object-cover'
                data-ai-hint="university campus"
            />
        </div>
        <CardHeader className="border-b">
            <CardTitle className="font-headline text-3xl">{collegeDetails.name}</CardTitle>
            <CardDescription>
                Department of Computer Science & Engineering
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
                    <p className="font-semibold text-justify">{collegeDetails.about}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
