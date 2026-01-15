'use client';

/**
 * Onboarding entry for Mixology (QR or direct).
 *
 * Provides a welcoming guest-first flow with optional account creation.
 * Attempts Firestore registration and falls back to local-only mode gracefully.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/mixology/auth';

export default function MixologyOnboardPage() {
  const router = useRouter();
  const { loading, isGuest, loginWithGoogle, resetSessionForNewAccount, startGuestSession } =
    useAuth();
  const [error, setError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'guest' | 'google' | 'reset' | null>(null);
  const [guestName, setGuestName] = useState('');

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncWarning(null);
    setBusyAction('guest');

    const result = await startGuestSession({
      displayName: guestName.trim() || undefined,
    });

    setBusyAction(null);

    if (!result.success) {
      setError(result.error ?? 'Failed to start session');
      return;
    }

    // Show warning if we fell back to local-only
    if (!result.syncedToFirestore && result.error) {
      setSyncWarning('Offline mode: your data is saved locally.');
    }

    router.push('/mixology/vote');
  };

  const handleGoogle = async () => {
    setError(null);
    setSyncWarning(null);
    setBusyAction('google');
    const result = await loginWithGoogle();
    setBusyAction(null);
    if (result.success) {
      router.push('/mixology/vote');
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
        <h1>Welcome to Mixology</h1>
        <p>Join the tasting and rate your favorite drinks!</p>

        {error && <div className="auth-error">{error}</div>}
        {syncWarning && <div className="auth-warning">{syncWarning}</div>}

        <form onSubmit={handleGuestContinue} className="guest-form">
          <div className="auth-field">
            <label htmlFor="guest-name">Your Name (optional)</label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter a display name"
              disabled={busyAction !== null}
            />
          </div>

          <button
            type="submit"
            className="button-primary"
            disabled={busyAction !== null}
            aria-busy={busyAction === 'guest'}
          >
            {busyAction === 'guest' ? 'Starting...' : 'Continue as Guest'}
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

        <p className="guest-note">
          Guest data is saved locally. Sign in to sync across devices.
        </p>
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
