'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/contest/contexts/auth/AuthContext';

import { isPlantTrackerEmailAllowed } from '../lib/access';
import { PlantSignInForm } from './PlantSignInForm';
import styles from './PlantAccessBoundary.module.scss';

interface PlantAccessBoundaryProps {
  children: ReactNode;
  variant?: 'page' | 'widget';
}

interface PlantAccessGateProps extends PlantAccessBoundaryProps {
  variant: 'page' | 'widget';
}

function PlantAccessGate({ children, variant }: PlantAccessGateProps) {
  const { loading, session, isAuthenticated, logout } = useAuth();

  const approved = isAuthenticated && isPlantTrackerEmailAllowed(session?.profile.email);

  if (loading) {
    return (
      <AccessFrame variant={variant}>
        <p className={styles.message}>Checking access…</p>
      </AccessFrame>
    );
  }

  if (approved) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <AccessFrame variant={variant}>
        {variant === 'page' ? (
          <h1 className={styles.title}>Plant tracker</h1>
        ) : (
          <h2 className={styles.title}>Plant care</h2>
        )}
        <p className={styles.message}>
          {session?.profile.email ?? 'This account'} is signed in, but it is not approved for the
          plant tracker.
        </p>
        <button type="button" className={styles.secondaryButton} onClick={() => void logout()}>
          Sign out
        </button>
      </AccessFrame>
    );
  }

  if (variant === 'widget') {
    return (
      <AccessFrame variant={variant}>
        <h2 className={styles.title}>Plant care</h2>
        <p className={styles.message}>Sign in to view or update private plant data.</p>
        <Link href="/plants" className={styles.link}>
          Open private tracker →
        </Link>
      </AccessFrame>
    );
  }

  return (
    <AccessFrame variant={variant}>
      <PlantSignInForm />
    </AccessFrame>
  );
}

function AccessFrame({ children, variant }: { children: ReactNode; variant: 'page' | 'widget' }) {
  if (variant === 'widget') {
    return <section className={`${styles.frame} ${styles.widget}`}>{children}</section>;
  }

  return (
    <main className={`${styles.frame} ${styles.page}`}>
      <Link href="/" className={styles.backLink}>
        ← Experiments
      </Link>
      <section className={styles.card}>{children}</section>
    </main>
  );
}

export function PlantAccessBoundary({ children, variant = 'page' }: PlantAccessBoundaryProps) {
  return (
    <AuthProvider>
      <PlantAccessGate variant={variant}>{children}</PlantAccessGate>
    </AuthProvider>
  );
}
