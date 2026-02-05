'use client';

import type { ReactNode } from 'react';
import { MixologyDataProvider } from '@/contest/contexts/MixologyDataContext';
import { ContestProvider } from '@/contest/contexts/contest/ContestContext';
import './mixology.scss';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return (
    <ContestProvider>
      <MixologyDataProvider>{children}</MixologyDataProvider>
    </ContestProvider>
  );
}
