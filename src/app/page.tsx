'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Shield, User, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex flex-col items-center justify-center gap-12">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>

      <div className="relative w-full max-w-4xl flex flex-col items-center gap-8 z-10">
        
        <div className="flex items-center gap-4 text-center flex-col">
           <div className="bg-primary p-3 rounded-lg shadow-xl mb-2">
             <BrainCircuit className="w-12 h-12 text-primary-foreground" />
           </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">Smart Attendance Portal</h1>
          </div>
        </div>
        
        <Card className="w-full bg-card/80 backdrop-blur-sm border-primary/10 shadow-2xl mt-4">
          <CardHeader className="text-center border-b border-primary/5">
            <CardTitle className="text-2xl font-bold">Welcome to the Portal</CardTitle>
            <CardDescription className="text-base">Please select your role to sign in to the attendance system.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <Link href="/admin-login" className="group flex flex-col items-center justify-center p-8 bg-muted/50 hover:bg-primary/5 rounded-xl text-center transition-all duration-300 ease-in-out border border-transparent hover:border-primary/20 shadow-sm hover:shadow-lg">
                  <Shield className="h-14 w-14 text-primary mb-4 transition-transform group-hover:scale-110" />
                  <h3 className="text-lg font-bold">Admin Login</h3>
                  <p className="text-xs text-muted-foreground mt-2">Manage system and reports</p>
              </Link>
              <Link href="/teacher-login" className="group flex flex-col items-center justify-center p-8 bg-muted/50 hover:bg-primary/5 rounded-xl text-center transition-all duration-300 ease-in-out border border-transparent hover:border-primary/20 shadow-sm hover:shadow-lg">
                  <User className="h-14 w-14 text-primary mb-4 transition-transform group-hover:scale-110" />
                  <h3 className="text-lg font-bold">Teacher Login</h3>
                  <p className="text-xs text-muted-foreground mt-2">Mark and manage attendance</p>
              </Link>
               <Link href="/student-login" className="group flex flex-col items-center justify-center p-8 bg-muted/50 hover:bg-primary/5 rounded-xl text-center transition-all duration-300 ease-in-out border border-transparent hover:border-primary/20 shadow-sm hover:shadow-lg">
                  <GraduationCap className="h-14 w-14 text-primary mb-4 transition-transform group-hover:scale-110" />
                  <h3 className="text-lg font-bold">Student Login</h3>
                  <p className="text-xs text-muted-foreground mt-2">View profile and history</p>
              </Link>
          </CardContent>
        </Card>
      </div>

       <footer className="relative text-center w-full text-xs text-muted-foreground z-10 px-4 mt-4 pb-8">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
        <p className="font-medium">&copy; {new Date().getFullYear()} JSS Polytechnic Nanjangud. All rights reserved.</p>
      </footer>
    </main>
  );
}
