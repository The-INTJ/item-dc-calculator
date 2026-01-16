'use client';

/**
 * Invite bootstrapper for Mixology.
 * Parses invite query params and auto-creates guest sessions when needed.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/mixology/auth';
import { parseInviteSearchParams } from '@/src/mixology/auth/invite';

export function InviteBootstrap() {
  const { session, isAuthenticated, loginAnonymously, applyInviteContext } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lastHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    const inviteContext = parseInviteSearchParams(searchParams);
    if (!inviteContext) return;

    const currentKey = `${pathname}?${searchParams.toString()}`;
    if (lastHandledRef.current === currentKey) return;
    lastHandledRef.current = currentKey;

    if (session) {
      applyInviteContext(inviteContext);
      return;
    }

    if (!isAuthenticated) {
      void loginAnonymously({ inviteContext });
    }
  }, [applyInviteContext, isAuthenticated, loginAnonymously, pathname, searchParams, session]);

  return null;
}
