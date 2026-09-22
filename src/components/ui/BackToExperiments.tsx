'use client';

import Link from 'next/link';
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import { armNavigationFallback, opensInThisTab } from '@/lib/navigation/navigationFallback';

const PORTAL_HREF = '/';

interface BackToExperimentsProps {
  className?: string;
  children?: ReactNode;
}

/**
 * The "← Experiments" link every experience page carries back to the portal.
 *
 * It is a real anchor, so it survives a page that never hydrated, and it arms
 * a fallback so it also survives a router that hydrated but can no longer
 * navigate — the case where the link looked dead until the page was reloaded.
 */
export function BackToExperiments({ className, children }: BackToExperimentsProps) {
  const cancelFallback = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelFallback.current?.(), []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!opensInThisTab(event)) {
      return;
    }
    cancelFallback.current?.();
    cancelFallback.current = armNavigationFallback(PORTAL_HREF);
  };

  return (
    <Link href={PORTAL_HREF} className={className} onClick={handleClick}>
      {children ?? '← Experiments'}
    </Link>
  );
}
