'use client';

/**
 * Onboarding entry for the contest app.
 *
 * Signed-out: guest-first welcome with email sign-in, Google, and a full
 * email/password registration view.
 * Guest: account-upgrade view — links credentials onto the SAME Firebase uid
 * so votes and registrations survive, plus the "start fresh" escape hatch.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { RegisterForm } from '@/contest/components/auth/RegisterForm';

export default function ContestOnboardPage() {
  const router = useRouter();
  const {
    loading,
    isGuest,
    session,
    startGuestSession,
    loginWithGoogle,
    login,
    upgradeGuestWithGoogle,
    resetSessionForNewAccount,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'welcome' | 'register'>('welcome');
  const [busyAction, setBusyAction] = useState<
    'anonymous' | 'google' | 'reset' | 'email' | 'upgrade-google' | null
  >(null);
  const [guestName, setGuestName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
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

  const handleUpgradeWithGoogle = async () => {
    setError(null);
    setBusyAction('upgrade-google');
    const result = await upgradeGuestWithGoogle();
    setBusyAction(null);
    if (result.success) {
      router.push('/contests');
    } else {
      setError(result.error ?? 'Account upgrade failed');
    }
  };

  const handleNewAccount = async () => {
    setError(null);
    setBusyAction('reset');
    await resetSessionForNewAccount();
    setBusyAction(null);
    setView('welcome');
  };

  // ── Guest: upgrade view ────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="account-page">
        <div className="guest-prompt">
          {error && <div className="auth-error">{error}</div>}

          <RegisterForm
            mode="upgrade"
            initialDisplayName={session?.profile.displayName ?? ''}
            onSuccess={() => router.push('/contests')}
          />

          <div className="guest-divider">
            <span>or</span>
          </div>

          <div className="guest-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={handleUpgradeWithGoogle}
              disabled={busyAction !== null}
              aria-busy={busyAction === 'upgrade-google'}
            >
              {busyAction === 'upgrade-google' ? 'Connecting...' : 'Upgrade with Google'}
            </button>
          </div>
        </div>

        <section className="account-section">
          <h2>Need a fresh start?</h2>
          <p>
            This signs you out of the current guest session. Votes cast as this guest stay with
            the old session and won&apos;t follow you.
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
      </div>
    );
  }

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

        {error && <div className="auth-error">{error}</div>}

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
          <button
            type="button"
            className="button-secondary"
            onClick={() => setView('register')}
            disabled={busyAction !== null}
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
