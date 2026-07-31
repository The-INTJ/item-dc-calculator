'use client';

import type {
  Contest,
  Contestant,
  ContestRound,
  Matchup,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import {
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../../lib/domain/matchupGetters';
import { AddMatchupForm } from './AddMatchupForm';
import { MatchupRow } from './MatchupRow';
import { RoundStateControls } from './RoundStateControls';

function statusLabel(status: ReturnType<typeof getComputedRoundStatus>): string {
  switch (status) {
    case 'active': return 'Active';
    case 'closed': return 'Closed';
    case 'upcoming': return 'Upcoming';
    case 'pending': return 'Not seeded';
  }
}

interface RoundCardProps {
  contest: Contest;
  round: ContestRound;
  index: number;
  matchups: Matchup[];
  maxScore: number;
  contestantsById: Map<string, Contestant>;
  isSelected: boolean;
  onSelect: (roundId: string) => void;
  seedError: string | undefined;
  onRequestSeed: (roundId: string, roundIndex: number, roundMatchups: Matchup[]) => void;
  onRequestForceClose: (roundId: string, roundMatchups: Matchup[]) => void;
}

/**
 * The matchup editor for one round: the editable matchup rows, the empty-state
 * hint, and the manual "Add matchup" form.
 */
function RoundMatchupsSection({
  contest,
  round,
  roundMatchups,
  maxScore,
  contestantsById,
  canSeed,
}: {
  contest: Contest;
  round: ContestRound;
  roundMatchups: Matchup[];
  maxScore: number;
  contestantsById: Map<string, Contestant>;
  canSeed: boolean;
}) {
  const { updateMatchup, createMatchup, deleteMatchup } = useContestStore();

  return (
    <>
      {roundMatchups.length > 0 && (
        <div className="admin-round-entries">
          {roundMatchups.map((matchup) => (
            <MatchupRow
              key={matchup.id}
              matchup={matchup}
              maxScore={maxScore}
              contestantsById={contestantsById}
              onMatchupUpdate={(updates) => updateMatchup(contest.id, matchup.id, updates)}
              onDelete={() => {
                if (window.confirm('Remove this matchup?')) {
                  void deleteMatchup(contest.id, matchup.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {roundMatchups.length === 0 && (
        <p className="admin-detail-meta" style={{ padding: '0.5rem' }}>
          No matchups yet. {canSeed ? 'Use "Seed round" to create them.' : 'Waiting on previous round to score.'}
        </p>
      )}

      <AddMatchupForm
        contestants={contest.contestants}
        nextSlotIndex={roundMatchups.length}
        onSubmit={(input) =>
          createMatchup(contest.id, { roundId: round.id, ...input })
        }
      />
    </>
  );
}

export function RoundCard({
  contest,
  round,
  index,
  matchups,
  maxScore,
  contestantsById,
  isSelected,
  onSelect,
  seedError,
  onRequestSeed,
  onRequestForceClose,
}: RoundCardProps) {
  const { removeRound } = useContestStore();

  const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
    (a, b) => a.slotIndex - b.slotIndex,
  );
  const status = getComputedRoundStatus(round, matchups);
  const canSeed = index === 0 ? contest.contestants.length >= 2 : roundMatchups.length === 0;

  return (
    <li
      className={[
        'admin-round-item',
        status === 'active' ? 'admin-round-item--active' : '',
        isSelected ? 'admin-round-item--selected' : '',
      ].join(' ')}
    >
      <button
        type="button"
        className="admin-round-item__header"
        onClick={() => onSelect(round.id)}
      >
        <div className="admin-round-item__info">
          <strong>Round {index + 1}</strong>
          <span className="admin-detail-meta">
            {roundMatchups.length} matchup{roundMatchups.length === 1 ? '' : 's'}
          </span>
        </div>
        <span className={`admin-round-badge admin-round-badge--${status}`}>
          {statusLabel(status)}
        </span>
      </button>

      {isSelected && (
        <RoundStateControls
          contestId={contest.id}
          round={round}
          roundMatchups={roundMatchups}
          canSeed={canSeed}
          seedError={seedError}
          onRequestSeed={() => onRequestSeed(round.id, index, roundMatchups)}
          onRequestForceClose={() => onRequestForceClose(round.id, roundMatchups)}
        />
      )}

      {isSelected && (
        <RoundMatchupsSection
          contest={contest}
          round={round}
          roundMatchups={roundMatchups}
          maxScore={maxScore}
          contestantsById={contestantsById}
          canSeed={canSeed}
        />
      )}

      <button
        type="button"
        className="button-secondary admin-round-item__remove"
        onClick={() => void removeRound(contest.id, round.id)}
        disabled={status === 'active' || roundMatchups.length > 0}
        title={
          roundMatchups.length > 0
            ? 'Delete this round’s matchups first — removing the round would orphan them.'
            : undefined
        }
      >
        Remove
      </button>
    </li>
  );
}
