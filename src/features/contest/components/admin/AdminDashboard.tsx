'use client';

/**
 * AdminDashboard - Main admin view for managing contests
 * Allows viewing contests, their details, and performing CRUD operations.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth/AuthContext';
import { useContestStore } from '../../contexts/contest/ContestContext';
import type { Contest } from '../../contexts/contest/contestTypes';
import { ContestCard } from './ContestCard';
import { ContestDetails } from './ContestDetails';

export function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const {
    contests,
    refresh,
    updateContest,
  } = useContestStore();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const loading = false;
  const error = null;

  useEffect(() => {
    if (!selectedContest && contests.length > 0) {
      const fallback = contests[0];
      setSelectedContest(fallback);
    }
  }, [contests, selectedContest]);

  useEffect(() => {
    if (!selectedContest) return;
    const latest = contests.find((contest) => contest.id === selectedContest.id);
    if (latest && latest !== selectedContest) {
      setSelectedContest(latest);
    }
  }, [contests, selectedContest]);

  if (authLoading) {
    return <div className="admin-loading">Checking admin access...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-error">
        <p>Sign in to access the admin dashboard.</p>
        <Link href="/onboard" className="button-secondary">
          Log in
        </Link>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="admin-error">
        <p>Admin access required.</p>
        <Link href="/contest" className="button-secondary">
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
    updateContest(contest.id, contest);
    setSelectedContest(contest);
    refresh();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Mixology Admin Dashboard</h1>
        <p>
          Manage contests, rounds, entries, and judges.
          Select a contest to view its details.
        </p>
        <button onClick={refresh} className="button-secondary">
          Refresh Data
        </button>
      </header>

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
          <div className="admin-add-contest">
            <Link href="/admin/contest-setup" className="button-primary">
              Create New Contest
            </Link>
          </div>
        </aside>

        <main className="admin-main">
          {selectedContest ? (
            <ContestDetails
              contest={selectedContest}
              onContestUpdated={handleContestUpdated}
            />
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
