'use client';

/**
 * AdminDashboard - Main admin view for testing backend integration
 * Allows viewing contests, their details, and testing CRUD operations.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/mixology/auth';
import { useContests } from '@/src/mixology/hooks';
import type { Contest } from '@/src/mixology/backend';
import { ContestCard } from './ContestCard';
import { ContestDetails } from './ContestDetails';
import { AdminStateControls } from './AdminStateControls';

export function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const { data: contests, loading, error, refresh } = useContests();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

  if (authLoading) {
    return <div className="admin-loading">Checking admin access...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-error">
        <p>Sign in to access the admin dashboard.</p>
        <Link href="/mixology/onboard" className="button-secondary">
          Log in
        </Link>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="admin-error">
        <p>Admin access required.</p>
        <Link href="/mixology" className="button-secondary">
          Return to Mixology
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-loading">Loading contests...</div>;
  }

  if (error) {
    return (
      <div className="admin-error">
        <p>Error loading contests: {error}</p>
        <button onClick={refresh} className="button-secondary">
          Retry
        </button>
      </div>
    );
  }

  const handleSelectContest = (contest: Contest) => {
    setSelectedContest(contest);
  };

  const handleContestUpdated = (contest: Contest) => {
    setSelectedContest(contest);
    refresh();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Mixology Admin Dashboard</h1>
        <p>
          This is a validation UI to test the backend abstraction layer.
          Select a contest to view its details.
        </p>
        <button onClick={refresh} className="button-secondary">
          Refresh Data
        </button>
      </header>

      <AdminStateControls />

      <div className="admin-dashboard__layout">
        <aside className="admin-sidebar">
          <h2>Contests</h2>
          {!contests || contests.length === 0 ? (
            <p className="admin-empty">No contests found.</p>
          ) : (
            <div className="admin-contest-list">
              {contests.map((contest) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  onSelect={handleSelectContest}
                  isSelected={selectedContest?.id === contest.id}
                />
              ))}
            </div>
          )}
        </aside>

        <main className="admin-main">
          {selectedContest ? (
            <ContestDetails contest={selectedContest} onContestUpdated={handleContestUpdated} />
          ) : (
            <div className="admin-placeholder">
              <p>Select a contest from the sidebar to view details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
