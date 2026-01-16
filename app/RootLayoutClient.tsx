'use client';

import type { ReactNode } from 'react';
import { MixologyAuthProvider } from '@/src/mixology/auth';
import { SiteHeader } from './components/SiteHeader';

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <MixologyAuthProvider>
      <SiteHeader />
      <main className="site-main">{children}</main>
    </MixologyAuthProvider>
  );
}
