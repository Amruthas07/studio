import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl font-bold text-primary">
            FaceAttend
          </CardTitle>
          <CardDescription>
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
