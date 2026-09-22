'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { AuthProvider, useAuth } from '@/contest/contexts/auth/AuthContext';
import { armNavigationFallback, opensInThisTab } from '@/lib/navigation/navigationFallback';

import styles from './PlantExperienceCard.module.scss';

const HREF = '/plants';

/** How long a click waits on the access check before going in regardless. */
const MAX_WAIT_MS = 4000;

interface PlantExperienceCardProps {
  title: string;
  description: string;
  classNames: { card: string; title: string; description: string };
}

function PlantEntryCard({ title, description, classNames }: PlantExperienceCardProps) {
  const { loading } = useAuth();
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const cancelFallback = useRef<(() => void) | null>(null);

  // A click that beat the access check is honoured the moment it settles —
  // or once waiting stops paying off, since /plants gates access itself.
  useEffect(() => {
    if (!entering) {
      return undefined;
    }

    const enter = () => {
      cancelFallback.current?.();
      cancelFallback.current = armNavigationFallback(HREF);
      router.push(HREF);
    };

    if (!loading) {
      enter();
      return undefined;
    }

    const timer = window.setTimeout(enter, MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [entering, loading, router]);

  useEffect(() => () => cancelFallback.current?.(), []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!opensInThisTab(event)) {
      return;
    }
    if (loading) {
      event.preventDefault();
      setEntering(true);
      return;
    }
    cancelFallback.current?.();
    cancelFallback.current = armNavigationFallback(HREF);
  };

  const blank = entering ? ` ${styles.blank}` : '';

  return (
    <Link
      href={HREF}
      className={`${classNames.card} ${styles.host}`}
      onClick={handleClick}
      aria-busy={entering}
    >
      <span className={`${classNames.title}${blank}`}>{title}</span>
      <span className={`${classNames.description}${blank}`}>{description}</span>
      {entering && (
        <span className={styles.spinnerLayer}>
          <span className={styles.spinner} aria-hidden="true" />
          <span role="status" className={styles.srOnly}>
            Opening plant tracker…
          </span>
        </span>
      )}
    </Link>
  );
}

/**
 * The portal's Plant Tracker card.
 *
 * The access check starts as soon as the portal renders but never draws
 * anything, so the grid is stable and clickable from the first paint. A click
 * that beats the check swaps the card's own text for a spinner inside the
 * exact same box — nothing on the page moves — and goes in once it settles.
 */
export function PlantExperienceCard(props: PlantExperienceCardProps) {
  return (
    <AuthProvider>
      <PlantEntryCard {...props} />
    </AuthProvider>
  );
}
