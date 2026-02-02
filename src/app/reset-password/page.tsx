'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
          <ResetPasswordForm />
          <div className="text-center text-sm mt-6">
            <Link href="/" className="text-card-foreground/80 hover:text-primary underline">
                Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
