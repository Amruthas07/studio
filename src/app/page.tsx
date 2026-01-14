
import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, MapPin, Phone, ShieldCheck, Cpu, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-25"></div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-face"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
             </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-slate-800">FaceAttend</h1>
              <p className="text-slate-600">AI-Powered Attendance Management</p>
            </div>
          </div>
          
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-700">Educational Institution</CardTitle>
              <CardDescription>Advanced facial recognition technology for seamless attendance tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-1 text-slate-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-600">Campus Address</h4>
                    <p className="text-slate-500">Mysore-Ooty Road</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 mt-1 text-slate-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-600">Contact</h4>
                    <p className="text-slate-500">+91 (800) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 mt-1 text-slate-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-600">Email</h4>
                    <p className="text-slate-500">info@faceattend.edu</p>
                  </div>
                </div>
              </div>
              
              <hr className="border-slate-200"/>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-full"><Cpu className="h-4 w-4 text-slate-500" /></div>
                    <span>Real-time face recognition</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-full"><ShieldCheck className="h-4 w-4 text-slate-500" /></div>
                    <span>Secure role-based access</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-full"><BarChart className="h-4 w-4 text-slate-500" /></div>
                    <span>Comprehensive reporting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800">
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
    </main>
  );
}
