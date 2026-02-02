'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Lock, Shield, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  department: z.string().optional(),
});

export interface LoginFormProps {
  isAdminForm: boolean;
}

export function LoginForm({ isAdminForm }: LoginFormProps) {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      department: 'cs',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const role = isAdminForm ? 'admin' : (pathname === '/teacher-login' ? 'teacher' : 'student');
    try {
        await login(values.email, values.password, role, values.department);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  return (
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
                  placeholder="Enter your email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
               <FormLabel className="flex items-center justify-between gap-2 text-card-foreground/80">
                <span className='flex items-center gap-2'>
                  <Lock className="h-4 w-4" />
                  Password
                </span>
                {!isAdminForm && (
                  <Link
                    href="/reset-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
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
                    Signing In...
                </>
            ) : (
                'Sign In'
            )}
        </Button>
        
        {isAdminForm && (
            <div className="flex items-center justify-center gap-4 text-xs text-card-foreground/60 pt-2">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4"/>
                    <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4"/>
                    <span>256-bit Encryption</span>
                </div>
            </div>
        )}

        <div className="text-center text-sm text-card-foreground/80">
            {pathname === '/' ? (
                <>
                Are you a student or teacher?{' '}
                <Link href="/student-login" className="font-semibold text-primary hover:underline">
                    Student Login
                </Link>
                {' | '}
                <Link href="/teacher-login" className="font-semibold text-primary hover:underline">
                    Teacher Login
                </Link>
                </>
            ) : pathname === '/student-login' ? (
                 <>
                Are you an administrator or teacher?{' '}
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Admin Login
                </Link>
                 {' | '}
                <Link href="/teacher-login" className="font-semibold text-primary hover:underline">
                    Teacher Login
                </Link>
                </>
            ) : (
                 <>
                Are you an administrator or student?{' '}
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Admin Login
                </Link>
                 {' | '}
                <Link href="/student-login" className="font-semibold text-primary hover:underline">
                    Student Login
                </Link>
                </>
            )}
        </div>
      </form>
    </Form>
  );
}
