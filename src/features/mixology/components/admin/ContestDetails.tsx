'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestConfig, Entry, Judge, ScoreEntry } from '../../lib/globals';
import { buildEntrySummary } from '../../lib/globals/uiTypes';
import { getEffectiveConfig } from '../../lib/globals';
import { getRoundLabel } from '../../lib/helpers/contestGetters';
import { DrinkCard } from '../ui';
import { useContestData } from '../../contexts/contest';
import { adminApi } from '../../services/adminApi';
import { AdminContestActivation } from './AdminContestActivation';
import { AdminContestRounds } from './AdminContestRounds';
import { AdminMixologists } from './AdminMixologists';
import { AdminRoundOverview } from './AdminRoundOverview';
import { ContestConfigEditor } from './ContestConfigEditor';
import { ContestPhaseControls } from './ContestPhaseControls';

interface ContestDetailsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
  onSetActiveContest: (contestId: string) => void;
}
function DrinkItem({ drink, roundLabel }: { drink: Entry; roundLabel: string }) {
  const summary = buildEntrySummary(drink);

  return (
    <li className="admin-detail-item">
      <DrinkCard drink={summary} variant="compact" showCreator />
      <span className="admin-detail-meta">Round: {roundLabel}</span>
    </li>
  );
}

function getRoleLabel(role: Judge['role']) {
  if (role === 'judge') return 'voter';
  return role;
}
function VoterItem({ judge }: { judge: Judge }) {
  return (
    <li className="admin-detail-item">
      <strong>{judge.displayName}</strong>
      <span className={`admin-role-badge admin-role-badge--${judge.role}`}>
        {getRoleLabel(judge.role)}
      </span>
    </li>
  );
}

function ScoreItem(
  { score, drinks, judges, config }: { score: ScoreEntry; drinks: Entry[]; judges: Judge[]; config: ContestConfig }
) {
  const drink = drinks.find((d) => d.id === (score.entryId ?? score.drinkId));
  const judge = judges.find((j) => j.id === score.judgeId);
  const total = config.attributes.reduce((sum, attr) => {
    const value = score.breakdown[attr.id];
    if (typeof value !== 'number' || !Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);
  const maxTotal = config.attributes.reduce((sum, attr) => sum + (attr.max ?? 10), 0);
  const formatValue = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 'N/A';

  return (
    <li className="admin-detail-item admin-score-item">
      <div className="admin-score-item__header">
        <strong>{drink?.name ?? 'Unknown'}</strong>
        <span className="admin-detail-meta">by {judge?.displayName ?? 'Unknown'}</span>
      </div>
      <div className="admin-score-item__breakdown">
        {config.attributes.map((attr) => (
          <span key={attr.id}>{attr.label}: {formatValue(score.breakdown[attr.id])}</span>
        ))}
        <strong>Total: {total}/{maxTotal}</strong>
      </div>
      {score.notes && <p className="admin-score-item__notes">{score.notes}</p>}
    </li>
  );
}

export function ContestDetails({ contest, onContestUpdated, onSetActiveContest }: ContestDetailsProps) {
  const router = useRouter();
  const { deleteContest } = useContestData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const activeRoundLabel = getRoundLabel(contest, contest.activeRoundId);
  const config = getEffectiveConfig(contest);
  
  const handleSaveConfig = async (config: ContestConfig) => {
    const result = await adminApi.updateContestConfig(contest.id, config);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to update config');
    }
    onContestUpdated(result.data);
  };

  const handleDeleteContest = async () => {
    const contestName = contest.name;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contestName}"?\n\nThis will permanently delete:\n• All rounds\n• All entries/drinks\n• All scores\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    const success = await deleteContest(contest.id);
    
    if (success) {
      // Navigate back to admin dashboard
      router.push('/mixology/admin');
    } else {
      setDeleteError('Failed to delete contest');
      setIsDeleting(false);
    }
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

      <AdminContestActivation
        contest={contest}
        isActive={Boolean(contest.defaultContest)}
        onSetActive={() => onSetActiveContest(contest.id)}
      />
      <ContestPhaseControls contest={contest} onContestUpdated={onContestUpdated} />
      <ContestConfigEditor contest={contest} onSave={handleSaveConfig} />
      <AdminContestRounds contest={contest} />
      <AdminMixologists contest={contest} />
      <AdminRoundOverview contest={contest} />
      <section className="admin-details-section">
        <h3>Vote categories</h3>
        <p className="admin-detail-meta">
          Server-managed categories are disabled for local testing.
        </p>
      </section>

      <section className="admin-details-section">
        <h3>Drinks ({contest.entries?.length})</h3>
        {contest.entries?.length === 0 ? (
          <p className="admin-empty">No drinks registered yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest?.entries?.map((drink) => (
              <DrinkItem
                key={drink.id}
                drink={drink}
                roundLabel={getRoundLabel(contest, drink.round)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Voters ({contest.judges.length})</h3>
        {contest.judges.length === 0 ? (
          <p className="admin-empty">No voters assigned yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.judges.map((judge) => (
              <VoterItem key={judge.id} judge={judge} />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Scores ({contest.scores.length})</h3>
        {contest.scores.length === 0 ? (
          <p className="admin-empty">No scores submitted yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.scores.map((score) => (
              <ScoreItem
                key={score.id}
                score={score}
                drinks={contest.entries}
                judges={contest.judges}
                config={config}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
