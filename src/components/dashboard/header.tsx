
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { UserNav } from './user-nav';
import type { ReactNode } from 'react';

function Logo() {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary-foreground">
      <div className="bg-primary p-2 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-face"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
      </div>
      <span className="font-headline text-primary-foreground">FaceAttend</span>
    </div>
  )
}

type HeaderProps = {
    sidebarContent: ReactNode;
};

export function Header({ sidebarContent }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-sidebar-bg px-4 md:px-6 sticky top-0 z-30 text-primary-foreground">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base text-foreground"
          >
            <Logo />
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden bg-transparent border-muted-foreground/50 text-muted-foreground hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 bg-sidebar-bg">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <UserNav />
        </div>
      </header>
  );
}
