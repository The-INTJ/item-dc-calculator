'use client';

import type { FormEvent } from 'react';
import type { SignInBusyAction } from './useSignInActions';

interface EmailSignInFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  busyAction: SignInBusyAction;
  onSubmit: (event: FormEvent) => void;
}

export function EmailSignInForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  busyAction,
  onSubmit,
}: EmailSignInFormProps) {
  return (
    <form onSubmit={onSubmit} className="guest-form">
      <div className="auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
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
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
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
  );
}
