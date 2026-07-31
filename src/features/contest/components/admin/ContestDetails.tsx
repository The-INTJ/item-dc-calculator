'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestConfig } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { useMatchupsSubscription } from '../../lib/realtime';
import { contestApi } from '../../lib/api/contestApi';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import { getEffectiveConfig } from '../../lib/domain/validation';
import { AdminContestants } from './AdminContestants';
import { AdminContestRounds } from './AdminContestRounds';
import { ContestConfigEditor } from './ContestConfigEditor';
import { useContestScores } from './useContestScores';
import { useSelectedRound } from './useSelectedRound';

interface ContestDetailsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

export function ContestDetails({ contest, onContestUpdated }: ContestDetailsProps) {
  const router = useRouter();
  const { deleteContest, matchupsByContestId } = useContestStore();
  useMatchupsSubscription(contest.id);
  const matchups = matchupsByContestId[contest.id] ?? [];

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rounds = contest.rounds ?? [];
  const { activeRoundId, selectedRoundId, setSelectedRoundId } = useSelectedRound(rounds, matchups);
  const contestScores = useContestScores(contest.id, matchups);

  const activeRoundLabel = getRoundLabel(contest, activeRoundId);
  const config = getEffectiveConfig(contest);
  const hasScores = matchups.some((m) =>
    m.entries.some((e) => (e.voteCount ?? 0) > 0),
  );

  const handleSaveConfig = async (nextConfig: ContestConfig) => {
    const result = await contestApi.updateContestConfig(contest.id, nextConfig);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to update config');
    }
    onContestUpdated(result.data);
  };

  const handleDeleteContest = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contest.name}"?\n\nThis will permanently delete:\n- All rounds\n- All entries\n- All scores\n\nThis action cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError(null);

    const success = await deleteContest(contest.id);
    if (success) {
      router.push('/admin');
      return;
    }

    setDeleteError('Failed to delete contest');
    setIsDeleting(false);
  };

  return (
    <div className="admin-contest-details">
      <header className="admin-contest-details__header">
        <div>
          <h2>{contest.name}</h2>
          <p className="admin-detail-meta">
            {contest.location ?? 'No location'} - {activeRoundLabel}
          </p>
        </div>
        <button
          type="button"
          className="button-secondary button-secondary--danger"
          onClick={handleDeleteContest}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Contest'}
        </button>
      </header>

      {deleteError ? (
        <div className="admin-phase-controls__message--error" style={{ marginBottom: '1rem' }}>
          {deleteError}
        </div>
      ) : null}

      {!hasScores && (
        <details className="admin-config-disclosure">
          <summary className="admin-config-disclosure__summary">Scoring setup</summary>
          <ContestConfigEditor contest={contest} onSave={handleSaveConfig} />
        </details>
      )}
      <AdminContestRounds
        contest={contest}
        config={config}
        matchups={matchups}
        selectedRoundId={selectedRoundId}
        onSelectRound={setSelectedRoundId}
      />
      <AdminContestants contest={contest} matchups={matchups} contestScores={contestScores} />
    </div>
  );
}
