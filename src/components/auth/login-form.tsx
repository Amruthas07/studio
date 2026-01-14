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
import { Loader2, Mail, Lock, Building, Shield, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      department: 'cs',
    },
  });

  const emailValue = form.watch("email");
  const isPotentiallyAdmin = emailValue.toLowerCase() === 'jsspn324@gmail.com';
  const showDepartmentSelector = isAdminForm && isPotentiallyAdmin;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        await login(values.email, values.password, values.department);
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
              <FormLabel className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email address"
                  {...field}
                  className="bg-slate-50 border-slate-200 text-slate-800"
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
               <FormLabel className="flex items-center gap-2 text-slate-600">
                <Lock className="h-4 w-4" />
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showDepartmentSelector && (
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-slate-600">
                    <Building className="h-4 w-4" />
                    Department
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cs">Computer Science (CS)</SelectItem>
                      <SelectItem value="ce">Civil Engineering (CE)</SelectItem>
                      <SelectItem value="me">Mechanical Engineering (ME)</SelectItem>
                      <SelectItem value="ee">Electrical Engineering (EE)</SelectItem>
                      <SelectItem value="mce">Mechatronics (MCE)</SelectItem>
                      <SelectItem value="ec">Electronics & Comm. (EC)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}

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
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
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

        <div className="text-center text-sm text-slate-600">
            {isAdminForm ? (
                <>
                Are you a student?{' '}
                <Link href="/student-login" className="font-semibold text-primary hover:underline">
                    Student Login
                </Link>
                </>
            ) : (
                 <>
                Are you an administrator?{' '}
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Admin Login
                </Link>
                </>
            )}
        </div>
      </form>
    </Form>
  );
}
