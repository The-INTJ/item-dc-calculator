'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/contest/contexts/auth/AuthContext';

import styles from './TracerRoot.module.scss';

/**
 * Wraps every Tracer page: the design tokens, plus the shared Firebase auth
 * session (mounted once in the route-group layout, so signing in as a guest
 * in the lobby carries straight into the game).
 */
export function TracerRoot({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className={styles.tracer}>{children}</div>
    </AuthProvider>
  );
}
