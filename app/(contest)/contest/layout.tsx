'use client';

import type { ReactNode } from 'react';
import { ContestDataProvider } from '@/contest/contexts/ContestDataContext';
import { ContestProvider } from '@/contest/contexts/contest/ContestContext';
import './mixology.scss';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return (
    <ContestProvider>
      <ContestDataProvider>{children}</ContestDataProvider>
    </ContestProvider>
  );
}
