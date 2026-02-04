'use client';

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth as useFirebaseAuth } from '@/firebase/provider';
import { sendPasswordResetEmail } from 'firebase/auth';
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
import { Loader2, Mail, Send } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
    const auth = useFirebaseAuth();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [emailSent, setEmailSent] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/reset-password`,
                handleCodeInApp: true,
            };
            await sendPasswordResetEmail(auth, values.email, actionCodeSettings);
            setEmailSent(true);
        } catch (error: any) {
            console.error("Password reset error:", error);
            toast({
                variant: 'destructive',
                title: 'Error Sending Email',
                description: 'Could not send password reset email. Please check the address and try again.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>
            <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm border border-border/50 shadow-lg z-10">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl text-card-foreground">Forgot Password</CardTitle>
                    <CardDescription className="text-card-foreground/80">
                        {emailSent
                            ? "A password reset link has been sent."
                            : "Enter your email to receive a password reset link."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {emailSent ? (
                        <div className="text-center p-6 rounded-lg bg-muted border border-border">
                            <Send className="h-12 w-12 mx-auto text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">Check Your Email</h3>
                            <p className="mt-2 text-muted-foreground">
                                An email is on its way to <span className="font-bold">{form.getValues('email')}</span>. If you don't see it, please check your spam folder.
                            </p>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-card-foreground/80">
                                                <Mail className="h-4 w-4" />
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
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
