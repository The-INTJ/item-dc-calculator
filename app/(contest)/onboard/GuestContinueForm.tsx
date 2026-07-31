'use client';

import type { FormEvent } from 'react';
import type { SignInBusyAction } from './useSignInActions';

interface GuestContinueFormProps {
  guestName: string;
  onGuestNameChange: (value: string) => void;
  busyAction: SignInBusyAction;
  onSubmit: (event: FormEvent) => void;
}

export function GuestContinueForm({
  guestName,
  onGuestNameChange,
  busyAction,
  onSubmit,
}: GuestContinueFormProps) {
  return (
    <form onSubmit={onSubmit} className="guest-form">
      <div className="auth-field">
        <label htmlFor="guest-name">Your Name (required)</label>
        <input
          id="guest-name"
          type="text"
          value={guestName}
          onChange={(e) => onGuestNameChange(e.target.value)}
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
  );
}
