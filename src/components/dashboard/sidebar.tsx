'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { University, LayoutDashboard, Users, FileClock, FileDown, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/attendance', icon: FileClock, label: 'Attendance' },
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
        <div className="hidden border-r bg-card md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b px-4 lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <University className="h-6 w-6 text-primary" />
                        <span className="font-headline">FaceAttend</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    pathname === item.href && "bg-secondary text-primary"
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
              <University className="h-6 w-6 text-primary" />
              <span className="sr-only">FaceAttend</span>
            </Link>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                        pathname === item.href && "bg-secondary text-foreground"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
