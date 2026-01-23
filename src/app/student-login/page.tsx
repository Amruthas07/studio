
import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function StudentLoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-primary p-3 rounded-lg">
               <BrainCircuit className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">SmartAttend</h1>
              <p className="text-foreground">Smart Attendance Management System</p>
            </div>
        </div>
        <Card className="w-full bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
                Student Login
            </CardTitle>
            <CardDescription>
                Enter your credentials to access your attendance
            </CardDescription>
            </CardHeader>
            <CardContent>
            <LoginFormDynamic isAdminForm={false} />
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
