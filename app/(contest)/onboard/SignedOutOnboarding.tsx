'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/contest/components/auth/RegisterForm';
import { EmailSignInForm } from './EmailSignInForm';
import { GuestContinueForm } from './GuestContinueForm';
import { useSignInActions } from './useSignInActions';

export function SignedOutOnboarding() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'register'>('welcome');
  const signIn = useSignInActions();

  // ── Signed out: registration view ──────────────────────────────────────────
  if (view === 'register') {
    return (
      <div className="account-page">
        <div className="guest-prompt">
          <RegisterForm
            onSuccess={() => router.push('/contests')}
            onSwitchToLogin={() => setView('welcome')}
          />
        </div>
      </div>
    );
  }

  // ── Signed out: welcome view ───────────────────────────────────────────────
  return (
    <div className="account-page">
      <div className="guest-prompt">
        <h1>Welcome to the Contest App</h1>
        <p>Join in and rate your favorite entries!</p>

        {signIn.error && <div className="auth-error">{signIn.error}</div>}

        <GuestContinueForm
          guestName={signIn.guestName}
          onGuestNameChange={signIn.setGuestName}
          busyAction={signIn.busyAction}
          onSubmit={signIn.handleGuestContinue}
        />

        <div className="guest-divider">
          <span>or</span>
        </div>

        <EmailSignInForm
          email={signIn.loginEmail}
          onEmailChange={signIn.setLoginEmail}
          password={signIn.loginPassword}
          onPasswordChange={signIn.setLoginPassword}
          busyAction={signIn.busyAction}
          onSubmit={signIn.handleEmailLogin}
        />

        <div className="guest-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={signIn.handleGoogle}
            disabled={signIn.busyAction !== null}
            aria-busy={signIn.busyAction === 'google'}
          >
            {signIn.busyAction === 'google' ? 'Connecting...' : 'Sign in with Google'}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setView('register')}
            disabled={signIn.busyAction !== null}
          >
            Need an account? Create one
          </button>
        </div>

        <p className="guest-note">
          Guest sessions are tied to this device — create an account to sign in anywhere and keep
          your votes.
        </p>
      </div>
    </div>
  );
}
