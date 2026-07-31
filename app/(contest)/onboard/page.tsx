'use client';

/**
 * Onboarding entry for the contest app.
 *
 * Signed-out: guest-first welcome with email sign-in, Google, and a full
 * email/password registration view.
 * Guest: account-upgrade view — links credentials onto the SAME Firebase uid
 * so votes and registrations survive, plus the "start fresh" escape hatch.
 */

import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { GuestUpgradeView } from './GuestUpgradeView';
import { SignedOutOnboarding } from './SignedOutOnboarding';

export default function ContestOnboardPage() {
  const { loading, isGuest } = useAuth();

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  if (isGuest) {
    return <GuestUpgradeView />;
  }

  return <SignedOutOnboarding />;
}
