'use client';

import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function StudentLoginPage() {
  
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex flex-col items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>

        <div className="flex items-center gap-4 mb-8 z-10">
             <div className="bg-primary p-3 rounded-lg">
               <BrainCircuit className="w-8 h-8 text-primary-foreground" />
             </div>
            <div>
              <h1 className="text-4xl font-bold font-headline text-primary">Smart Institute</h1>
              <p className="text-2xl text-foreground">Smart Attendance Management System</p>
            </div>
        </div>

        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm z-10">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
                Student Login
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
