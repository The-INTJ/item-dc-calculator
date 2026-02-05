'use client';

/**
 * Account page - manage user session
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/mixology/contexts/AuthContext';
import { UserMenu } from '@/mixology/components/auth/UserMenu';

export default function AccountPage() {
  const { loading, session } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  return (
    <div className="account-page">
      <h1>Account & Session</h1>

      <section className="account-section">
        <h2>Current Status</h2>
        <UserMenu
          onLogin={() => router.push('/mixology/onboard')}
          onRegister={() => router.push('/mixology/onboard')}
        />
      </section>

      {!session && (
        <section className="account-section">
          <h2>Get Started</h2>
          <div className="account-actions">
            <Link href="/mixology/onboard" className="button-primary">
              Open onboarding flow
            </Link>
          </div>
        </section>
      )}

      {session && (
        <section className="account-section">
          <h2>Session Data</h2>
          <div className="account-debug">
            <div><strong>Session ID:</strong> {session.sessionId}</div>
            <div><strong>Status:</strong> {session.status}</div>
            <div><strong>Display Name:</strong> {session.profile.displayName}</div>
            <div><strong>Role:</strong> {session.profile.role}</div>
            <div><strong>Firebase UID:</strong> {session.firebaseUid}</div>
            <div><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</div>
            <div><strong>Updated:</strong> {new Date(session.updatedAt).toLocaleString()}</div>
          </div>
        </section>
      )}
    </div>
  );
}
