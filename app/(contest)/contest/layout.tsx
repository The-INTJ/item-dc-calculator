'use client';

import type { ReactNode } from 'react';
import { ActiveContestProvider } from '@/contest/contexts/ActiveContestContext';
import './contest.scss';

export default function ContestLayout({ children }: { children: ReactNode }) {
  return (
    <ActiveContestProvider>{children}</ActiveContestProvider>
  );
}
