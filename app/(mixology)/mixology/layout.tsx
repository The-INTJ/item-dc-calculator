'use client';

import type { ReactNode } from 'react';
import { MixologyDataProvider } from '@/mixology/contexts/MixologyDataContext';
import { AdminContestProvider } from '@/mixology/contexts/AdminContestContext';
import './mixology.scss';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return (
    <AdminContestProvider>
      <MixologyDataProvider>{children}</MixologyDataProvider>
    </AdminContestProvider>
  );
}
