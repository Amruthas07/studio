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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase/provider';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

type ResetPasswordFormProps = {
    oobCode: string;
};

export function ResetPasswordForm({ oobCode }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Optional: Verify the code on component mount to give early feedback.
  React.useEffect(() => {
    const verifyCode = async () => {
        setLoading(true);
        try {
            await verifyPasswordResetCode(auth, oobCode);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Invalid Link',
                description: 'This password reset link is invalid or has expired. Please request a new one.',
            });
            router.push('/forgot-password');
        } finally {
            setLoading(false);
        }
    };
    verifyCode();
  }, [auth, oobCode, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        await confirmPasswordReset(auth, oobCode, values.newPassword);
        toast({
            title: 'Password Reset Successful',
            description: 'Your password has been changed. You can now log in with your new password.',
        });
        // Redirect to login page after a short delay
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
              <FormLabel className="text-card-foreground/80">New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your new password"
                  {...field}
                />
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
              <FormLabel className="text-card-foreground/80">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your new password"
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
              Saving...
            </>
          ) : (
            'Save New Password'
          )}
        </Button>
      </form>
    </Form>
  );
}
