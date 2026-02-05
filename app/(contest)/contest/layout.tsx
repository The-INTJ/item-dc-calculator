'use client';

import type { ReactNode } from 'react';
import { ContestDataProvider } from '@/contest/contexts/ContestDataContext';
import { ContestProvider } from '@/contest/contexts/contest/ContestContext';
import './contest.scss';

export default function ContestLayout({ children }: { children: ReactNode }) {
  return (
    <ContestProvider>
      <ContestDataProvider>{children}</ContestDataProvider>
    </ContestProvider>
  );
}
