'use client';

import type { ReactNode } from 'react';
import { MixologyAuthProvider } from '@/src/mixology/auth';
import { ContestStateProvider } from '@/src/mixology/state';
import { SiteHeader } from './components/SiteHeader';

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
