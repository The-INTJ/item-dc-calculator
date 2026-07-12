'use client';

/**
 * AdminDashboard - Main admin view for managing contests
 * Allows viewing contests, their details, and performing CRUD operations.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '../../contexts/auth/AuthContext';
import { useContestStore } from '../../contexts/contest/ContestContext';
import type { Contest } from '../../contexts/contest/contestTypes';
import { ContestCard } from './ContestCard';
import { ContestDetails } from './ContestDetails';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  setLastAdminContest,
  useLastAdminContest,
} from '../../lib/hooks/useLastAdminContest';

export function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const {
    contests,
    loading,
    error,
    refresh,
    updateContest,
  } = useContestStore();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const lastAdminContest = useLastAdminContest();

  useEffect(() => {
    if (selectedContest || contests.length === 0) return;
    const remembered = lastAdminContest
      ? contests.find((c) => c.id === lastAdminContest.id)
      : null;
    setSelectedContest(remembered ?? contests[0]);
  }, [contests, selectedContest, lastAdminContest]);

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
        <Button href="/onboard" variant="secondary">
          Log in
        </Button>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="admin-error">
        <p>Admin access required.</p>
        <Button href="/contests" variant="secondary">
          Return to contests
        </Button>
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
        <Button onClick={refresh} variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const handleSelectContest = (contest: Contest) => {
    setSelectedContest(contest);
    setLastAdminContest({ id: contest.id, name: contest.name });
  };

  const handleContestUpdated = (contest: Contest) => {
    updateContest(contest.id, contest);
    setSelectedContest(contest);
    refresh();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Admin Dashboard</h1>
        <p>
          Manage contests, rounds, entries, and voters.
          Select a contest to view its details.
        </p>
        <Button onClick={refresh} variant="secondary">
          Refresh Data
        </Button>
      </header>

      <div className="admin-dashboard__layout">
        <aside className={`admin-sidebar ${sidebarCollapsed ? 'admin-sidebar--collapsed' : ''}`}>
          <button
            type="button"
            className="admin-sidebar__toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            <span>Contests ({contests.length})</span>
            <MaterialSymbol
              name={sidebarCollapsed ? 'expand_more' : 'expand_less'}
              className="admin-sidebar__chevron"
            />
          </button>
          <div className="admin-sidebar__body">
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
              <Button href="/admin/contest-setup" variant="primary">
                Create New Contest
              </Button>
            </div>
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
