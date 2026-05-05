'use client';

/**
 * Onboarding entry for the contest app.
 *
 * Provides a welcoming guest-first flow with optional account creation.
 * Guest and Google sign-in both rely on Firebase-backed auth flows.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contest/contexts/auth/AuthContext';

export default function ContestOnboardPage() {
  const router = useRouter();
  const { loading, isGuest, startGuestSession, loginWithGoogle, login, resetSessionForNewAccount } =
    useAuth();
  const [error, setError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'anonymous' | 'google' | 'reset' | 'email' | null>(null);
  const [guestName, setGuestName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncWarning(null);
    const trimmedName = guestName.trim();

    if (!trimmedName) {
      setError('Display name is required to continue as guest.');
      return;
    }

    setBusyAction('anonymous');

    const result = await startGuestSession(trimmedName);

    setBusyAction(null);

    if (!result.success) {
      setError(result.error ?? 'Anonymous sign-in failed');
      return;
    }

    router.push('/contests');
  };

  const handleGoogle = async () => {
    setError(null);
    setSyncWarning(null);
    setBusyAction('google');
    const result = await loginWithGoogle();
    setBusyAction(null);
    if (result.success) {
      router.push('/contests');
    } else {
      setError(result.error ?? 'Google sign-in failed');
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncWarning(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Email and password are required.');
      return;
    }
    setBusyAction('email');
    const result = await login({ email: loginEmail.trim(), password: loginPassword });
    setBusyAction(null);
    if (result.success) {
      router.push('/contests');
    } else {
      setError(result.error ?? 'Sign in failed');
    }
  };

  const handleNewAccount = async () => {
    setError(null);
    setSyncWarning(null);
    setBusyAction('reset');
    await resetSessionForNewAccount();
    setBusyAction(null);
  };

  return (
    <div className="account-page">
      <div className="guest-prompt">
        <h1>Welcome to the Contest App</h1>
        <p>Join in and rate your favorite entries!</p>

        {error && <div className="auth-error">{error}</div>}
        {syncWarning && <div className="auth-warning">{syncWarning}</div>}

        <form onSubmit={handleGuestContinue} className="guest-form">
          <div className="auth-field">
            <label htmlFor="guest-name">Your Name (required)</label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your display name"
              disabled={busyAction !== null}
              required
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="button-primary"
            disabled={busyAction !== null}
            aria-busy={busyAction === 'anonymous'}
          >
            {busyAction === 'anonymous' ? 'Connecting...' : 'Continue anonymously'}
          </button>
        </form>

        <div className="guest-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleEmailLogin} className="guest-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busyAction !== null}
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={busyAction !== null}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="button-secondary"
            disabled={busyAction !== null}
            aria-busy={busyAction === 'email'}
          >
            {busyAction === 'email' ? 'Signing in...' : 'Sign in with email'}
          </button>
        </form>

        <div className="guest-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={handleGoogle}
            disabled={busyAction !== null}
            aria-busy={busyAction === 'google'}
          >
            {busyAction === 'google' ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>

        <p className="guest-note">Anonymous sign-in still syncs your data across devices.</p>
      </div>

      {isGuest && (
        <section className="account-section">
          <h2>Need a fresh start?</h2>
          <p>
            This will clear local voting history on this device before signing in again.
          </p>
          <button
            type="button"
            className="button-secondary"
            onClick={handleNewAccount}
            disabled={busyAction !== null}
            aria-busy={busyAction === 'reset'}
          >
            {busyAction === 'reset' ? 'Resetting...' : 'Start fresh'}
          </button>
        </section>
      )}
    </div>
  );
}
