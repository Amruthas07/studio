'use client';

import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, ShieldCheck, UserCheck, BarChart, BrainCircuit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';

export default function Home() {
  const { institutionProfile, loading } = useInstitutionProfile();

  const details = institutionProfile || {
      name: "Smart Institute",
      address: "123 Innovation Drive, Electronic City, Bengaluru",
      contact: "08221 - 226491 | Cell: +91 9886618231",
      email: "info@smartinstitute.edu",
  };
  
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-lg">
               <BrainCircuit className="w-8 h-8 text-primary-foreground" />
             </div>
            <div>
              <h1 className="text-4xl font-bold font-headline text-primary">{details.name}</h1>
              <p className="text-2xl text-foreground">Smart Attendance Management System</p>
            </div>
          </div>
          
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Educational Institution</CardTitle>
              <CardDescription>Efficient Smart attendance tracking and reporting for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                   <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Campus Address</h4>
                        <p className="text-muted-foreground">{details.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Contact</h4>
                        <p className="text-muted-foreground">{details.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p className="text-muted-foreground">{details.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              
              <hr className="border-border/50"/>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded-full"><UserCheck className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Simplified Manual Entry</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded-full"><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Secure role-based access</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded-full"><BarChart className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Comprehensive reporting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    Login
                </CardTitle>
                <CardDescription>
                    Enter your credentials to access the system
                </CardDescription>
                </CardHeader>
                <CardContent>
                <LoginFormDynamic />
                </CardContent>
            </Card>
        </div>

      </div>
       <footer className="absolute bottom-4 text-center w-full text-xs text-foreground z-10">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Link href="/terms" className="hover:text-primary">Terms & Conditions</Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </div>
        <p>&copy; 2026 Smart Institute. All rights reserved.</p>
      </footer>
    </main>
  );
}
