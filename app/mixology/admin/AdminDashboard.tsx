'use client';

/**
 * AdminDashboard - Main admin view for testing backend integration
 * Allows viewing contests, their details, and testing CRUD operations.
 */

import { useState } from 'react';
import { useContests } from '@/src/mixology/hooks';
import type { Contest } from '@/src/mixology/backend';
import { ContestCard } from './ContestCard';
import { ContestDetails } from './ContestDetails';

export function AdminDashboard() {
  const { data: contests, loading, error, refresh } = useContests();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

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
            <ContestDetails contest={selectedContest} />
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
