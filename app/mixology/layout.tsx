'use client';

import type { ReactNode } from 'react';
import { MixologyDataProvider } from '@/src/mixology/data/MixologyDataContext';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return <MixologyDataProvider>{children}</MixologyDataProvider>;
}
