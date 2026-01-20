'use client';

/**
 * Guest prompt - offers to continue as guest or create account.
 *
 * Attempts Firestore registration for guests, with graceful fallback to local-only.
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GuestPromptProps {
  onContinue?: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
}

export function GuestPrompt({ onContinue, onSwitchToLogin, onSwitchToRegister }: GuestPromptProps) {
  const { loginAnonymously } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('Display name is required to continue as guest.');
      return;
    }

    setBusy(true);

    const result = await loginAnonymously({
      displayName: trimmedName,
    });

    setBusy(false);

    if (!result.success) {
      setError(result.error ?? 'Anonymous sign-in failed');
      return;
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
          <label htmlFor="guest-name">Your Name (required)</label>
          <input
            id="guest-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={busy}
            required
            aria-required="true"
          />
        </div>

        <button type="submit" className="button-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Connecting...' : 'Continue anonymously'}
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

      <p className="guest-note">Anonymous sign-in still syncs your data across devices.</p>
    </div>
  );
}
