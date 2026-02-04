'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Shield, User, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useInstitutionProfile } from '@/hooks/use-institution-profile';

export default function Home() {
  const { institutionProfile } = useInstitutionProfile();

  const details = institutionProfile || {
      name: "Smart Institute",
  };
  
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>

      <div className="relative w-full max-w-4xl flex flex-col items-center gap-8 z-10">
        
        <div className="flex items-center gap-4 text-center flex-col">
           <div className="bg-primary p-3 rounded-lg">
             <BrainCircuit className="w-10 h-10 text-primary-foreground" />
           </div>
          <div>
            <h1 className="text-5xl font-bold font-headline text-primary">{details.name}</h1>
            <p className="text-2xl text-foreground mt-2">Smart Attendance Management System</p>
          </div>
        </div>
        
        <Card className="w-full bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Welcome to the Portal</CardTitle>
            <CardDescription>Please select your role to sign in.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin-login" className="flex flex-col items-center justify-center p-6 bg-muted hover:bg-muted/80 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105">
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold">Admin Login</h3>
              </Link>
              <Link href="/teacher-login" className="flex flex-col items-center justify-center p-6 bg-muted hover:bg-muted/80 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105">
                  <User className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold">Teacher Login</h3>
              </Link>
               <Link href="/student-login" className="flex flex-col items-center justify-center p-6 bg-muted hover:bg-muted/80 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105">
                  <GraduationCap className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold">Student Login</h3>
              </Link>
          </CardContent>
        </Card>
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
