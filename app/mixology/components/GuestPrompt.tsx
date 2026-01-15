'use client';

/**
 * Guest prompt - offers to continue as guest or create account.
 *
 * Attempts Firestore registration for guests, with graceful fallback to local-only.
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/src/mixology/auth';

interface GuestPromptProps {
  onContinue?: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
}

export function GuestPrompt({ onContinue, onSwitchToLogin, onSwitchToRegister }: GuestPromptProps) {
  const { startGuestSession } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result = await startGuestSession({
      displayName: displayName.trim() || undefined,
    });

    setBusy(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to start session');
      return;
    }

    // Log if we fell back to local-only (not blocking)
    if (!result.syncedToFirestore) {
      console.info('[GuestPrompt] Started in local-only mode');
    }

    onContinue?.();
  };

  return (
    <div className="guest-prompt">
      <h2>Welcome to Mixology</h2>
      <p>Join the tasting and rate your favorite drinks!</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleGuestContinue} className="guest-form">
        <div className="auth-field">
          <label htmlFor="guest-name">Your Name (optional)</label>
          <input
            id="guest-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter a display name"
            disabled={busy}
          />
        </div>

        <button type="submit" className="button-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Starting...' : 'Continue as Guest'}
        </button>
      </form>

      <div className="guest-divider">
        <span>or</span>
      </div>

      <div className="guest-actions">
        {onSwitchToLogin && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="button-secondary"
            disabled={busy}
          >
            Sign In
          </button>
        )}
        {onSwitchToRegister && (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="button-secondary"
            disabled={busy}
          >
            Create Account
          </button>
        )}
      </div>

      <p className="guest-note">
        Guest data is saved locally. Create an account to sync across devices.
      </p>
    </div>
  );
}
