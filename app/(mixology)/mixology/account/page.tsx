'use client';

/**
 * Account page - manage user session and test auth flows
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/mixology/contexts/AuthContext';
import { UserMenu } from '@/mixology/components/auth/UserMenu';

export default function AccountPage() {
  const { loading, session, isAuthenticated, isGuest, recordVote } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="account-loading">Loading session...</div>;
  }

  // Test adding a vote
  const handleTestVote = async () => {
    await recordVote({
      contestId: 'contest-cascadia-24',
      drinkId: 'drink-sea-fog',
      score: Math.floor(Math.random() * 10) + 1,
      breakdown: {
        aroma: Math.floor(Math.random() * 10) + 1,
        balance: Math.floor(Math.random() * 10) + 1,
        presentation: Math.floor(Math.random() * 10) + 1,
        creativity: Math.floor(Math.random() * 10) + 1,
        overall: Math.floor(Math.random() * 10) + 1,
      },
    });
  };

  return (
    <div className="account-page">
      <h1>Account & Session</h1>
      <p>Test the guest/user experience and auth flows.</p>

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
        <>
          <section className="account-section">
            <h2>Session Data</h2>
            <div className="account-debug">
              <div><strong>Session ID:</strong> {session.sessionId}</div>
              <div><strong>Status:</strong> {session.status}</div>
              <div><strong>Display Name:</strong> {session.profile.displayName}</div>
              <div><strong>Role:</strong> {session.profile.role}</div>
              {session.firebaseUid && (
                <div><strong>Firebase UID:</strong> {session.firebaseUid}</div>
              )}
              <div><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</div>
              <div><strong>Updated:</strong> {new Date(session.updatedAt).toLocaleString()}</div>
            </div>
          </section>

          <section className="account-section">
            <h2>Votes ({session.votes.length})</h2>
            {session.votes.length === 0 ? (
              <p>No votes yet. Use the button below to add a test vote.</p>
            ) : (
              <ul className="account-votes">
                {session.votes.map((vote, idx) => (
                  <li key={idx}>
                    <strong>{vote.drinkId}</strong>: {vote.score}/10
                    <span className="vote-time">
                      {new Date(vote.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={handleTestVote} className="button-secondary">
              Add Test Vote
            </button>
          </section>

          {session.pendingSync && (
            <section className="account-section account-section--warning">
              <h2>Pending Sync</h2>
              <p>
                {session.pendingSync.votes?.length ?? 0} votes pending sync.
                {session.pendingSync.failureCount
                  ? ` (${session.pendingSync.failureCount} failed attempts)`
                  : ''}
              </p>
              {isGuest && (
                <p className="account-hint">
                  Create an account to sync your data to the cloud.
                </p>
              )}
            </section>
          )}
        </>
      )}

      <section className="account-section">
        <h2>Auth Flow Notes</h2>
        <ul className="account-notes">
          <li>
            <strong>Guest:</strong> Data stored locally in localStorage. Survives page refreshes.
          </li>
          <li>
            <strong>Register:</strong> Creates account and syncs local data to backend.
          </li>
          <li>
            <strong>Login:</strong> Merges local guest data with backend data.
          </li>
          <li>
            <strong>Offline:</strong> Votes queue locally and sync when connection returns.
          </li>
        </ul>
      </section>

    </div>
  );
}
