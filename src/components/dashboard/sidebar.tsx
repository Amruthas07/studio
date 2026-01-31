'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileClock, User, ShieldCheck, Building, BrainCircuit, UserCheck, FileText, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';


function Logo() {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
      <div className="bg-primary p-2 rounded-md">
        <BrainCircuit className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="font-headline text-primary whitespace-nowrap">Smart Institute</span>
    </div>
  )
}

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/profile', icon: Building, label: 'Institution' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/teachers', icon: UserCog, label: 'Teachers' },
    { href: '/admin/reports', icon: FileText, label: 'Reports' },
];

const studentNavItems = [
    { href: '/student/profile', icon: User, label: 'My Profile' },
    { href: '/student/attendance', icon: ShieldCheck, label: 'My Attendance' },
];

const teacherNavItems = [
    { href: '/teacher/profile', icon: User, label: 'My Profile' },
    { href: '/teacher/students', icon: Users, label: 'Students' },
];

function getNavItems(role?: 'admin' | 'student' | 'teacher') {
    switch (role) {
        case 'admin': return adminNavItems;
        case 'student': return studentNavItems;
        case 'teacher': return teacherNavItems;
        default: return [];
    }
}

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    const navItems = getNavItems(user?.role);

    return (
        <div className="hidden border-r bg-sidebar-bg md:block text-muted-foreground">
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
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : ""
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
    
    const navItems = getNavItems(user?.role);

     return (
        <nav className="grid gap-2 text-lg font-medium p-4 text-muted-foreground">
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
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-accent-foreground hover:bg-accent",
                         pathname === item.href ? "bg-accent text-accent-foreground" : ""
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
