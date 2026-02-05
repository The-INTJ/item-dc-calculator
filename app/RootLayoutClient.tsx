'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/src/features/contest/contexts/auth/AuthContext';
import { RoundStateProvider } from '@/src/features/contest/contexts/RoundStateContext';
import { SiteHeader } from '@/components/layout/SiteHeader';

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <AuthProvider>
      <RoundStateProvider>
        <SiteHeader />
        <main className="site-main">{children}</main>
      </RoundStateProvider>
    </AuthProvider>
  );
}
