
import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentLoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="absolute inset-0 bg-gradient-to-br from-background to-accent/20"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-primary p-3 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-face"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">FaceAttend</h1>
              <p className="text-muted-foreground">AI-Powered Attendance Management</p>
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
