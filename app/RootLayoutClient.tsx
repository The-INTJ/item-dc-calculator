'use client';

import type { ReactNode } from 'react';
import { MixologyAuthProvider } from '@/mixology/contexts/AuthContext';
import { ContestStateProvider } from '@/mixology/contexts/ContestStateContext';
import { SiteHeader } from '@/components/layout/SiteHeader';

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <MixologyAuthProvider>
      <ContestStateProvider>
        <SiteHeader />
        <main className="site-main">{children}</main>
      </ContestStateProvider>
    </MixologyAuthProvider>
  );
}
