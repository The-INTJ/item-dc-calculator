'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { RegisterForm } from '@/contest/components/auth/RegisterForm';

type UpgradeBusyAction = 'reset' | 'upgrade-google' | null;

// ── Guest: upgrade view ────────────────────────────────────────────────────
export function GuestUpgradeView() {
  const router = useRouter();
  const { session, upgradeGuestWithGoogle, resetSessionForNewAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<UpgradeBusyAction>(null);

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
    // Resetting flips the session to signed-out, so the page swaps this view
    // for SignedOutOnboarding, which mounts in its default 'welcome' view —
    // the same landing spot the old inline setView('welcome') produced.
  };

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
