'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth as useFirebaseAuth } from '@/firebase/provider';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
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
import { Loader2, Mail, Send, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Schema for the email form
const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

// Schema for the password reset form
const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


// Component for entering a new password
function ResetPasswordForm({ oobCode }: { oobCode: string }) {
  const { toast } = useToast();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, values.newPassword);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been changed. You can now log in.',
      });
      setTimeout(() => router.push('/'), 2000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Resetting Password',
        description: 'This link may have expired. Please try again.',
      });
      setLoading(false);
    }
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
                <Input type="password" placeholder="Enter new password" {...field} />
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
                <Input type="password" placeholder="Confirm new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save New Password'}
        </Button>
      </form>
    </Form>
  );
}

// Component for sending the reset email
function SendEmailForm() {
    const auth = useFirebaseAuth();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [emailSent, setEmailSent] = React.useState(false);

    const form = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: z.infer<typeof emailSchema>) {
        setLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/forgot-password`,
                handleCodeInApp: true,
            };
            await sendPasswordResetEmail(auth, values.email, actionCodeSettings);
            setEmailSent(true);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Sending Email',
                description: 'Could not send password reset email. Please check the address.',
            });
        } finally {
            setLoading(false);
        }
    }

    if (emailSent) {
        return (
            <div className="text-center p-6 rounded-lg bg-muted border">
                <Send className="h-12 w-12 mx-auto text-primary" />
                <h3 className="mt-4 text-lg font-semibold">Check Your Email</h3>
                <p className="mt-2 text-muted-foreground">
                    A password reset link is on its way to <span className="font-bold">{form.getValues('email')}</span>. Click it to reset your password.
                </p>
            </div>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />Email Address
                            </FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </Button>
            </form>
        </Form>
    )
}

// The main page component that decides which form to show
function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    if (oobCode) {
        return <ResetPasswordForm oobCode={oobCode} />;
    }
    
    return <SendEmailForm />;
}

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  // We read this here just to change the title/description
  const oobCode = searchParams.get('oobCode');

  return (
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>
          <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm border shadow-lg z-10">
              <CardHeader className="text-center">
                  <CardTitle className="font-headline text-3xl">Forgot Password</CardTitle>
                  <CardDescription>
                      {oobCode ? "Create a new password for your account." : "Enter your email to receive a password reset link."}
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <React.Suspense fallback={<Skeleton className="h-40 w-full" />}>
                     <ForgotPasswordContent />
                  </React.Suspense>
              </CardContent>
               <CardFooter className="justify-center pt-4">
                  <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
                      Back to Login
                  </Link>
              </CardFooter>
          </Card>
      </main>
  );
}