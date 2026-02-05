'use client';

import type { ReactNode } from 'react';
import { MixologyDataProvider } from '@/mixology/contexts/MixologyDataContext';
import { ContestProvider } from '@/mixology/contexts/contest';
import './mixology.scss';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return (
    <ContestProvider>
      <MixologyDataProvider>{children}</MixologyDataProvider>
    </ContestProvider>
  );
}
