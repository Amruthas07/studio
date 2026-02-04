'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth as useFirebaseAuthHook } from '@/hooks/use-auth';
import { useAuth as useFirebaseAuthInstance } from '@/firebase/provider';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, KeyRound, BrainCircuit, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Schema for the password reset form
const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});

function DirectUpdatePasswordForm() {
  const { toast } = useToast();
  const authInstance = useFirebaseAuthInstance();
  const { user: authUser, loading: authLoading } = useFirebaseAuthHook();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  React.useEffect(() => {
      if (!authLoading && !authUser) {
          toast({
              variant: 'destructive',
              title: 'Authentication Required',
              description: 'You must be logged in to change your password. Redirecting to login...',
          });
          router.push('/');
      }
  }, [authUser, authLoading, router, toast]);

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    if (!authInstance.currentUser) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'Could not find an authenticated user.',
        });
        return;
    }

    setLoading(true);
    try {
      await updatePassword(authInstance.currentUser, values.newPassword);
      toast({
        title: 'Password Updated Successfully',
        description: 'Your password has been changed. Please log in again.',
      });
      router.push('/'); 
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
          toast({
              variant: 'destructive',
              title: 'Action Requires Recent Login',
              description: 'Please log out and log back in to change your password.',
          });
          router.push('/');
      } else {
          toast({
            variant: 'destructive',
            title: 'Error Updating Password',
            description: error.message || 'An unexpected error occurred.',
          });
      }
    } finally {
        setLoading(false);
    }
  }

  if (authLoading || !authUser) {
      return (
          <div className="flex flex-col space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4" />New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showNewPassword ? 'text' : 'password'} placeholder="Enter new password" {...field} />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showNewPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" {...field} />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>
    </Form>
  );
}

export default function ForgotPasswordPage() {
  return (
      <main className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="flex items-center gap-4 mb-8 z-10 self-start">
                <div className="bg-primary p-3 rounded-lg">
                    <BrainCircuit className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Smart Institute</h1>
                    <p className="text-xl text-foreground">Attendance Management</p>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center w-full">
               <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl">
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Enter a new password for your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <React.Suspense fallback={<Skeleton className="h-40 w-full" />}>
                           <DirectUpdatePasswordForm />
                        </React.Suspense>
                    </CardContent>
                     <CardFooter className="justify-center pt-4">
                        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
                            Back to Home
                        </Link>
                    </CardFooter>
                </Card>
            </div>
             <footer className="w-full text-center text-xs text-foreground mt-8">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <Link href="/terms" className="hover:text-primary">Terms</Link>
                    <span className="text-muted-foreground">|</span>
                    <Link href="/privacy" className="hover:text-primary">Privacy</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} Smart Institute. All rights reserved.</p>
            </footer>
          </div>
          <div className="relative hidden lg:block">
              <Image 
                src="https://picsum.photos/seed/secure-login/1920/1080" 
                alt="Abstract decorative background" 
                fill 
                className="object-cover"
                data-ai-hint="security abstract"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
              <div className="absolute bottom-12 left-12 text-white max-w-md z-10">
                  <h2 className="text-4xl font-bold font-headline">Secure & Simple.</h2>
                  <p className="mt-2 text-lg text-white/80">Update your password with confidence.</p>
              </div>
          </div>
      </main>
  );
}
