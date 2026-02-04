'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ResetPasswordForm = dynamic(
    () => import('@/components/auth/reset-password-form').then((mod) => mod.ResetPasswordForm),
    { 
        ssr: false,
        loading: () => (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }
);

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  if (!oobCode) {
    return (
      <div className='text-center text-destructive'>
        <p className='font-bold'>Invalid Password Reset Link.</p>
        <p className='text-sm'>The link is either expired or incorrect. Please request a new one.</p>
      </div>
    );
  }
  
  return <ResetPasswordForm oobCode={oobCode} />;
}


export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>

      <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm border border-border/50 shadow-lg z-10">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-card-foreground">Reset Password</CardTitle>
          <CardDescription className="text-card-foreground/80">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <React.Suspense fallback={<div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <ResetPasswordContent />
          </React.Suspense>
          <div className="text-center text-sm mt-6">
            <Link href="/" className="text-card-foreground/80 hover:text-primary underline">
                Back to Portal
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
