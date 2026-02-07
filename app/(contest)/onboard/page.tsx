'use client';

/**
 * Onboarding entry for Mixology (QR or direct).
 *
 * Provides a welcoming guest-first flow with optional account creation.
 * Attempts Firestore registration and falls back to local-only mode gracefully.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/contest/contexts/auth/AuthContext';

export default function MixologyOnboardPage() {
  const router = useRouter();
  const { loading, isGuest, startGuestSession, loginWithGoogle, resetSessionForNewAccount } =
    useAuth();
  const [error, setError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'anonymous' | 'google' | 'reset' | null>(null);
  const [guestName, setGuestName] = useState('');

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

    router.push('/');
  };

  const handleGoogle = async () => {
    setError(null);
    setSyncWarning(null);
    setBusyAction('google');
    const result = await loginWithGoogle();
    setBusyAction(null);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error ?? 'Google sign-in failed');
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
