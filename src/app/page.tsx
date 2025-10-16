import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
       <Image
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
          alt="University campus"
          fill
          className="object-cover -z-10"
          data-ai-hint="university campus"
          priority
        />
        <div className="absolute inset-0 bg-black/60 -z-10" />

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border/20 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl font-bold text-primary-foreground">
            SMART ATTENDANCE SYSTEM
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Smart Face Recognition Attendance System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginFormDynamic />
        </CardContent>
      </Card>
    </main>
  );
}
