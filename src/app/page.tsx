
import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, MapPin, Phone, ShieldCheck, UserCheck, BarChart, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-lg">
               <BrainCircuit className="w-8 h-8 text-primary-foreground" />
             </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">SmartAttend</h1>
              <p className="text-foreground">Smart Attendance Management System</p>
            </div>
          </div>
          
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Educational Institution</CardTitle>
              <CardDescription>Efficient Smart attendance tracking and reporting for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-card-foreground">Campus Address</h4>
                    <p className="text-muted-foreground">Mysore-Ooty Road</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-card-foreground">Contact</h4>
                    <p className="text-muted-foreground">+91 (800) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-card-foreground">Email</h4>
                    <p className="text-muted-foreground">info@smartattend.edu</p>
                  </div>
                </div>
              </div>
              
              <hr className="border-border/50"/>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="p-2 bg-muted rounded-full"><UserCheck className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Simplified Manual Entry</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="p-2 bg-muted rounded-full"><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Secure role-based access</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="p-2 bg-muted rounded-full"><BarChart className="h-4 w-4 text-muted-foreground" /></div>
                    <span>Comprehensive reporting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                    Administrator Login
                </CardTitle>
                <CardDescription>
                    Access the attendance management system
                </CardDescription>
                </CardHeader>
                <CardContent>
                <LoginFormDynamic isAdminForm={true} />
                </CardContent>
            </Card>
        </div>

      </div>
       <footer className="absolute bottom-4 text-center w-full text-xs text-foreground z-10">
        <div className="flex justify-center gap-4 mb-2">
            <Link href="/terms" className="hover:text-primary">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </div>
        <p>&copy; 2024 SmartAttend. All rights reserved.</p>
      </footer>
    </main>
  );
}
