'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestConfig, Entry, Voter, ScoreEntry } from '../../contexts/contest/contestTypes';
import { buildEntrySummary } from '../../lib/helpers/uiMappings';
import { getEffectiveConfig } from '../../lib/helpers/validation';
import { getRoundLabel } from '../../lib/helpers/contestGetters';
import { EntryCard } from '../ui/EntryCard';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { adminApi } from '../../lib/api/adminApi';
import { AdminContestRounds } from './AdminContestRounds';
import { AdminContestants } from './AdminContestants';
import { AdminRoundOverview } from './AdminRoundOverview';
import { ContestConfigEditor } from './ContestConfigEditor';
import { ContestPhaseControls } from './ContestPhaseControls';

interface ContestDetailsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

function EntryItem({ entry, roundLabel }: { entry: Entry; roundLabel: string }) {
  const summary = buildEntrySummary(entry);

  return (
    <li className="admin-detail-item">
      <EntryCard entry={summary} variant="compact" showCreator />
      <span className="admin-detail-meta">Round: {roundLabel}</span>
    </li>
  );
}

function getRoleLabel(role: Voter['role']) {
  if (role === 'voter') return 'voter';
  return role;
}

function VoterItem({ voter }: { voter: Voter }) {
  return (
    <li className="admin-detail-item">
      <strong>{voter.displayName}</strong>
      <span className={`admin-role-badge admin-role-badge--${voter.role}`}>
        {getRoleLabel(voter.role)}
      </span>
    </li>
  );
}

function ScoreItem({ score, entries, voters, config }: { score: ScoreEntry; entries: Entry[]; voters: Voter[]; config: ContestConfig }) {
  const entry = entries.find((candidate) => candidate.id === score.entryId);
  const voter = voters.find((candidate) => candidate.id === score.userId);
  const total = config.attributes.reduce((sum, attr) => {
    const value = score.breakdown[attr.id];
    if (typeof value !== 'number' || !Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);
  const maxTotal = config.attributes.reduce((sum, attr) => sum + (attr.max ?? 10), 0);

  return (
    <li className="admin-detail-item admin-score-item">
      <div className="admin-score-item__header">
        <strong>{entry?.name ?? 'Unknown'}</strong>
        <span className="admin-detail-meta">by {voter?.displayName ?? 'Unknown'}</span>
      </div>
      <div className="admin-score-item__breakdown">
        {config.attributes.map((attr) => (
          <span key={attr.id}>{attr.label}: {score.breakdown[attr.id] ?? 'N/A'}</span>
        ))}
        <strong>Total: {total}/{maxTotal}</strong>
      </div>
      {score.notes && <p className="admin-score-item__notes">{score.notes}</p>}
    </li>
  );
}

export function ContestDetails({ contest, onContestUpdated }: ContestDetailsProps) {
  const router = useRouter();
  const { deleteContest } = useContestStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contestScores, setContestScores] = useState<ScoreEntry[]>([]);

  const activeRoundLabel = getRoundLabel(contest, contest.activeRoundId);
  const config = getEffectiveConfig(contest);

  // Fetch scores from subcollection for admin detail view
  useEffect(() => {
    if (!contest.id) return;
    // Fetch all scores for each entry
    const fetchScores = async () => {
      const allScores: ScoreEntry[] = [];
      for (const entry of contest.entries) {
        try {
          const res = await fetch(`/api/contest/contests/${contest.id}/scores?entryId=${entry.id}`);
          if (res.ok) {
            const data = await res.json();
            allScores.push(...(data.scores ?? []));
          }
        } catch { /* ignore fetch errors */ }
      }
      setContestScores(allScores);
    };
    void fetchScores();
  }, [contest.id, contest.entries.length]);

  const handleSaveConfig = async (nextConfig: ContestConfig) => {
    const result = await adminApi.updateContestConfig(contest.id, nextConfig);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to update config');
    }
    onContestUpdated(result.data);
  };

  const handleDeleteContest = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contest.name}"?\n\nThis will permanently delete:\n• All rounds\n• All entries\n• All scores\n\nThis action cannot be undone.`
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
            {contest.location ?? 'No location'} • {activeRoundLabel}
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

      {deleteError && (
        <div className="admin-phase-controls__message--error" style={{ marginBottom: '1rem' }}>
          {deleteError}
        </div>
      )}

      <ContestPhaseControls contest={contest} onContestUpdated={onContestUpdated} />
      <ContestConfigEditor contest={contest} onSave={handleSaveConfig} />
      <AdminContestRounds contest={contest} />
      <AdminContestants contest={contest} />
      <AdminRoundOverview contest={contest} />

      <section className="admin-details-section">
        <h3>Vote categories</h3>
        <p className="admin-detail-meta">Server-managed categories are disabled for local testing.</p>
      </section>

      <section className="admin-details-section">
        <h3>Entries ({contest.entries.length})</h3>
        {contest.entries.length === 0 ? (
          <p className="admin-empty">No entries registered yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                roundLabel={getRoundLabel(contest, entry.round)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Voters ({contest.voters?.length ?? 0})</h3>
        {(contest.voters?.length ?? 0) === 0 ? (
          <p className="admin-empty">No voters assigned yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.voters.map((voter) => (
              <VoterItem key={voter.id} voter={voter} />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Scores ({contestScores.length})</h3>
        {contestScores.length === 0 ? (
          <p className="admin-empty">No scores submitted yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contestScores.map((score) => (
              <ScoreItem
                key={score.id}
                score={score}
                entries={contest.entries}
                voters={contest.voters}
                config={config}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
