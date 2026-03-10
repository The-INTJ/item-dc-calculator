'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contest/contexts/auth/AuthContext';
import { ContestProvider } from '@/contest/contexts/contest/ContestContext';
import { SiteHeader } from '@/components/layout/SiteHeader';

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isDisplayMode = pathname.startsWith('/contest/') && pathname.endsWith('/display');
  const mainClassName = isDisplayMode ? 'site-main site-main--display' : 'site-main';

  return (
    <AuthProvider>
      <ContestProvider>
        <SiteHeader />
        <main className={mainClassName}>{children}</main>
      </ContestProvider>
    </AuthProvider>
  );
}
