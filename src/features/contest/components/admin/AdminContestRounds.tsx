'use client';

import { useMemo } from 'react';
import { ConfirmDialog } from '@/components/ui';
import type {
  Contest,
  ContestConfig,
  Matchup,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getRequiredRoundCount } from '../../lib/domain/bracketMath';
import { RoundCard } from './RoundCard';
import { describePendingAction, useRoundActions } from './useRoundActions';

interface AdminContestRoundsProps {
  contest: Contest;
  config: ContestConfig;
  matchups: Matchup[];
  selectedRoundId: string | null;
  onSelectRound: (roundId: string) => void;
}

export function AdminContestRounds({
  contest,
  config,
  matchups,
  selectedRoundId,
  onSelectRound,
}: AdminContestRoundsProps) {
  const { addRound } = useContestStore();

  const rounds = contest.rounds ?? [];
  const maxScore = config.attributes.reduce((sum, a) => sum + (a.max ?? 10), 0);

  const contestantsById = useMemo(
    () => new Map(contest.contestants.map((c) => [c.id, c])),
    [contest.contestants],
  );

  const {
    seedErrorByRound,
    pendingAction,
    requestSeed,
    requestForceClose,
    confirmPendingAction,
    cancelPendingAction,
  } = useRoundActions(contest);

  const handleAddRound = () => void addRound(contest.id);

  const dialogCopy = describePendingAction(pendingAction);

  return (
    <section className="admin-details-section">
      <div className="admin-rounds-header">
        <h3>Rounds</h3>
      </div>

      <RoundCountAdvisory
        contestantCount={contest.contestants.length}
        roundCount={rounds.length}
        contestantLabelPlural={config.contestantLabelPlural ?? 'contestants'}
      />

      <ul className="admin-detail-list admin-rounds-list">
        {rounds.map((round, index) => (
          <RoundCard
            key={round.id}
            contest={contest}
            round={round}
            index={index}
            matchups={matchups}
            maxScore={maxScore}
            contestantsById={contestantsById}
            isSelected={round.id === selectedRoundId}
            onSelect={onSelectRound}
            seedError={seedErrorByRound[round.id]}
            onRequestSeed={requestSeed}
            onRequestForceClose={requestForceClose}
          />
        ))}
      </ul>

      <div className="admin-rounds-add">
        <button type="button" className="button-secondary" onClick={handleAddRound}>
          Add round
        </button>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={dialogCopy.title}
        message={dialogCopy.message}
        confirmLabel={dialogCopy.confirmLabel}
        cancelLabel="Cancel"
        onConfirm={confirmPendingAction}
        onCancel={cancelPendingAction}
      />
    </section>
  );
}

/**
 * Non-blocking heads-up when the round count and field size disagree: too few
 * rounds can't crown a champion (the display renders it fine, but the "final"
 * is really a semifinal); surplus rounds will just be byes.
 */
function RoundCountAdvisory({
  contestantCount,
  roundCount,
  contestantLabelPlural,
}: {
  contestantCount: number;
  roundCount: number;
  contestantLabelPlural: string;
}) {
  const required = getRequiredRoundCount(contestantCount);
  if (required === 0 || roundCount === 0) return null;

  if (roundCount < required) {
    return (
      <p className="admin-round-advisory admin-round-advisory--warning" role="status">
        {contestantCount} {contestantLabelPlural.toLowerCase()} need {required} rounds to crown a
        champion — this contest has {roundCount}. Use &quot;Add round&quot; below.
      </p>
    );
  }
  if (roundCount > required) {
    return (
      <p className="admin-round-advisory" role="status">
        A field of {contestantCount} resolves in {required} round{required === 1 ? '' : 's'} —
        rounds beyond that will be byes.
      </p>
    );
  }
  return null;
}
