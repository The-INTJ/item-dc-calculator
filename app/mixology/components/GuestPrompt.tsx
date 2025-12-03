'use client';

/**
 * Guest prompt - offers to continue as guest or create account
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

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    await startGuestSession(displayName || undefined);
    onContinue?.();
  };

  return (
    <div className="guest-prompt">
      <h2>Welcome to Mixology</h2>
      <p>Join the tasting and rate your favorite drinks!</p>

      <form onSubmit={handleGuestContinue} className="guest-form">
        <div className="auth-field">
          <label htmlFor="guest-name">Your Name (optional)</label>
          <input
            id="guest-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter a display name"
          />
        </div>

        <button type="submit" className="button-primary">
          Continue as Guest
        </button>
      </form>

      <div className="guest-divider">
        <span>or</span>
      </div>

      <div className="guest-actions">
        {onSwitchToLogin && (
          <button type="button" onClick={onSwitchToLogin} className="button-secondary">
            Sign In
          </button>
        )}
        {onSwitchToRegister && (
          <button type="button" onClick={onSwitchToRegister} className="button-secondary">
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
