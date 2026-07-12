'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/contest/contexts/auth/AuthContext';

import { isPlantTrackerEmailAllowed } from '../lib/access';
import styles from './PlantAccessBoundary.module.scss';

interface PlantAccessBoundaryProps {
  children: ReactNode;
  variant?: 'page' | 'widget';
}

interface PlantAccessGateProps extends PlantAccessBoundaryProps {
  variant: 'page' | 'widget';
}

function PlantAccessGate({ children, variant }: PlantAccessGateProps) {
  const { loading, session, isAuthenticated, login, loginWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const approved = isAuthenticated && isPlantTrackerEmailAllowed(session?.profile.email);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPasswordBusy(true);
    const result = await login({ email: email.trim(), password });
    setPasswordBusy(false);
    if (!result.success) {
      setError(result.error ?? 'Sign-in failed.');
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleBusy(true);
    const result = await loginWithGoogle();
    setGoogleBusy(false);
    if (!result.success) {
      setError(result.error ?? 'Google sign-in failed.');
    }
  }

  async function handleLogout() {
    setError(null);
    await logout();
  }

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
        <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
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
      <h1 className={styles.title}>Plant tracker</h1>
      <p className={styles.message}>Sign in with an approved Firebase account to continue.</p>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handlePasswordLogin}>
        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className={styles.primaryButton} disabled={passwordBusy}>
          {passwordBusy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button
        type="button"
        className={styles.secondaryButton}
        onClick={handleGoogleLogin}
        disabled={googleBusy}
      >
        {googleBusy ? 'Connecting…' : 'Continue with Google'}
      </button>
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
