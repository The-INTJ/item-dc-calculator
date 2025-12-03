'use client';

/**
 * Mixology client layout wrapper
 * Provides auth context to all mixology pages
 */

import type { ReactNode } from 'react';
import { MixologyAuthProvider } from '@/src/mixology/auth';

interface MixologyLayoutClientProps {
  children: ReactNode;
}

export function MixologyLayoutClient({ children }: MixologyLayoutClientProps) {
  return <MixologyAuthProvider>{children}</MixologyAuthProvider>;
}
