'use client';

import type { ReactNode } from 'react';
import { MixologyAuthProvider } from '@/src/features/mixology/contexts/auth/AuthContext';
import { RoundStateProvider } from '@/src/features/mixology/contexts/RoundStateContext';
import { SiteHeader } from '@/components/layout/SiteHeader';

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <MixologyAuthProvider>
      <RoundStateProvider>
        <SiteHeader />
        <main className="site-main">{children}</main>
      </RoundStateProvider>
    </MixologyAuthProvider>
  );
}
