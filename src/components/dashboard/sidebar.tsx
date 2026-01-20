
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileClock, FileDown, User, ShieldCheck, Building, Camera, History, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';


function Logo() {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold md:text-base text-foreground">
      <div className="bg-primary p-2 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-face"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
      </div>
      <span className="font-headline text-slate-800">FaceAttend</span>
    </div>
  )
}

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/profile', icon: Building, label: 'Institution' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/face-enrollment', icon: UserPlus, label: 'Face Enrollment' },
    { href: '/admin/live-attendance', icon: Camera, label: 'Live Attendance' },
    { href: '/admin/attendance', icon: FileClock, label: 'Attendance Log' },
    { href: '/admin/live-captures', icon: History, label: 'Capture Log' },
    { href: '/admin/reports', icon: FileDown, label: 'Reports' },
];

const studentNavItems = [
    { href: '/student/profile', icon: User, label: 'My Profile' },
    { href: '/student/attendance', icon: ShieldCheck, label: 'My Attendance' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

    return (
        <div className="hidden border-r bg-white md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b px-4 lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                       <Logo />
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900",
                                    pathname.startsWith(item.href) && item.href !== '/admin' && !['/admin/students', '/admin/face-enrollment', '/admin/live-attendance', '/admin/attendance', '/admin/live-captures', '/admin/reports'].includes(item.href) ? "bg-slate-100 text-slate-900" : pathname === item.href ? "bg-slate-100 text-slate-900" : ""
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebarContent() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

     return (
        <nav className="grid gap-2 text-lg font-medium p-4">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Logo />
            </Link>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-slate-600 hover:text-slate-900",
                         pathname.startsWith(item.href) && item.href !== '/admin' && !['/admin/students', '/admin/face-enrollment', '/admin/live-attendance', '/admin/attendance', '/admin/live-captures', '/admin/reports'].includes(item.href) ? "bg-slate-100 text-slate-900" : pathname === item.href ? "bg-slate-100 text-slate-900" : ""
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
