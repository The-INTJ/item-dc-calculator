'use client';

/**
 * AdminDashboard - Main admin view for testing backend integration
 * Allows viewing contests, their details, and testing CRUD operations.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminContestData } from '../../contexts/AdminContestContext';
import type { Contest } from '../../types';
import { ContestCard } from './ContestCard';
import { ContestDetails } from './ContestDetails';

export function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const {
    contests,
    activeContestId,
    refresh,
    setActiveContest,
    updateContest,
    useLocalDebugData,
    setUseLocalDebugData,
  } = useAdminContestData();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const loading = false;
  const error = null;

  useEffect(() => {
    if (!selectedContest && contests.length > 0) {
      const fallback = contests.find((contest) => contest.id === activeContestId) ?? contests[0];
      setSelectedContest(fallback);
    }
  }, [contests, activeContestId, selectedContest]);

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
    updateContest(contest.id, contest);
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
        <div className="admin-debug-toggle">
          <label className="admin-debug-toggle__label">
            <input
              type="checkbox"
              checked={useLocalDebugData}
              onChange={(event) => setUseLocalDebugData(event.target.checked)}
            />
            <span>Use local debug dataset</span>
          </label>
          <p className="admin-detail-meta">
            This toggle swaps the admin view to pre-populated local data for stress testing. It is
            separate from the live contest debug state.
          </p>
        </div>
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
            <Link href="/mixology/admin/contest-setup" className="button-primary">
              Create New Contest
            </Link>
          </div>
        </aside>

        <main className="admin-main">
          {selectedContest ? (
            <ContestDetails
              contest={selectedContest}
              onContestUpdated={handleContestUpdated}
              onSetActiveContest={setActiveContest}
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
