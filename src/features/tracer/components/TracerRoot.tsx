import type { ReactNode } from 'react';

import { AuthProvider } from '@/contest/contexts/auth/AuthContext';

import styles from './TracerRoot.module.scss';

/** Every Tracer page: the design tokens and the base page styling. */
export function TracerRoot({ children }: { children: ReactNode }) {
  return <div className={styles.tracer}>{children}</div>;
}

/**
 * The Firebase sign-in session, for the pages that need one: the lobby
 * (online games are created under your name) and online games. Local games
 * deliberately sit outside it, so playing on one device makes no auth calls.
 */
export function TracerAuth({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
