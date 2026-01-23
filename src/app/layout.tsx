
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { StudentsProvider } from '@/contexts/students-context';
import { AttendanceProvider } from '@/contexts/attendance-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const fontSourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export const metadata: Metadata = {
  title: 'SmartAttend | AI-Powered Attendance Management',
  description: 'A Smart Face Recognition Attendance System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          fontInter.variable,
          fontSpaceGrotesk.variable,
          fontSourceCodePro.variable
        )}
      >
        <FirebaseClientProvider>
          <AuthProvider>
            <StudentsProvider>
              <AttendanceProvider>
                  {children}
                  <Toaster />
              </AttendanceProvider>
            </StudentsProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
