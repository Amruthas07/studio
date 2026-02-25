'use client';

import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function TeacherLoginPage() {
  
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex flex-col items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>

        <div className="flex items-center gap-4 mb-8 z-10 text-center flex-col">
             <div className="bg-primary p-3 rounded-lg">
               <BrainCircuit className="w-10 h-10 text-primary-foreground" />
             </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">Smart Attendance Portal</h1>
            </div>
        </div>

        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm z-10">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
                Teacher Login
            </CardTitle>
            <CardDescription>
                Enter your credentials to access your portal.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginFormDynamic />
            </CardContent>
            <CardFooter className="justify-center pt-4">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    Back to Portal
                </Link>
            </CardFooter>
        </Card>

       <footer className="absolute bottom-4 text-center w-full text-xs text-foreground z-10 px-4">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Link href="/terms" className="hover:text-primary">Terms & Conditions</Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} JSS Polytechnic Nanjangud. All rights reserved.</p>
      </footer>
    </main>
  );
}
