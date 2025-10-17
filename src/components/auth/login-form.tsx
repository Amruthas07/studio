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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  department: z.string().optional(),
});

export function LoginForm() {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = form.watch("email");
  const isAdmin = emailValue.toLowerCase() === 'jsspn324@gmail.com';

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // For admin, append department to password before sending to auth context
      const passwordToSend = isAdmin && values.department 
        ? `571301${values.department}`
        : values.password;

      await login(values.email, passwordToSend);
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isAdmin && (
           <FormField
              control={form.control}
              name="department"
              defaultValue='cs'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department to manage" />
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
        
        <div className="flex items-center justify-between pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                    </>
                ) : (
                    'Sign In'
                )}
            </Button>
        </div>
        <div className="text-center text-sm">
            <Link href="/reset-password" className="text-muted-foreground hover:text-primary underline">
                Forgot password?
            </Link>
        </div>
      </form>
    </Form>
  );
}
