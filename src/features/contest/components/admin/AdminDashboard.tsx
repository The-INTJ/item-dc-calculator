'use client';

/**
 * AdminDashboard - Main admin view for managing contests
 * Allows viewing contests, their details, and performing CRUD operations.
 */

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '../../contexts/auth/AuthContext';
import { useContestStore } from '../../contexts/contest/ContestContext';
import type { Contest } from '../../contexts/contest/contestTypes';
import { ContestDetails } from './ContestDetails';
import { AdminContestSidebar } from './AdminContestSidebar';
import { AdminGateNotice, resolveAdminGate } from './adminDashboardGate';
import { useSelectedAdminContest } from './useSelectedAdminContest';

export function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const {
    contests,
    loading,
    error,
    refresh,
    updateContest,
  } = useContestStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { selectedContest, setSelectedContest, selectContest } = useSelectedAdminContest(contests);

  const gate = resolveAdminGate({ authLoading, isAuthenticated, role, loading, error });
  if (gate) {
    return <AdminGateNotice state={gate} onRetry={refresh} />;
  }

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
        <AdminContestSidebar
          contests={contests}
          selectedContestId={selectedContest?.id}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onSelect={selectContest}
        />

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
