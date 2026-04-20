'use client';

import { useMemo, useState } from 'react';
import type {
  Contest,
  ContestConfig,
  Matchup,
  MatchupPhase,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import {
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../../lib/domain/matchupGetters';
import { getEntryScore } from '../../lib/domain/contestGetters';
import {
  MATCHUP_PHASE_VALUES,
  matchupPhaseLabels,
} from '../../lib/domain/matchupPhases';

interface AdminContestRoundsProps {
  contest: Contest;
  config: ContestConfig;
  matchups: Matchup[];
  selectedRoundId: string | null;
  onSelectRound: (roundId: string) => void;
}

function statusLabel(status: ReturnType<typeof getComputedRoundStatus>): string {
  switch (status) {
    case 'active': return 'Active';
    case 'closed': return 'Closed';
    case 'upcoming': return 'Upcoming';
    case 'pending': return 'Not seeded';
  }
}

export function AdminContestRounds({
  contest,
  config,
  matchups,
  selectedRoundId,
  onSelectRound,
}: AdminContestRoundsProps) {
  const { addRound, removeRound, setRoundOverride, updateMatchup, seedRound } = useContestStore();

  const rounds = contest.rounds ?? [];
  const maxScore = config.attributes.reduce((sum, a) => sum + (a.max ?? 10), 0);

  const entriesById = useMemo(
    () => new Map(contest.entries.map((e) => [e.id, e])),
    [contest.entries],
  );

  const handleAddRound = () => void addRound(contest.id);

  return (
    <section className="admin-details-section">
      <div className="admin-rounds-header">
        <h3>Rounds</h3>
      </div>

      <ul className="admin-detail-list admin-rounds-list">
        {rounds.map((round, index) => {
          const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
            (a, b) => a.slotIndex - b.slotIndex,
          );
          const status = getComputedRoundStatus(round, matchups);
          const isSelected = round.id === selectedRoundId;
          const canSeed = index === 0
            ? contest.entries.length >= 2
            : roundMatchups.length === 0;

          return (
            <li
              key={round.id}
              className={[
                'admin-round-item',
                status === 'active' ? 'admin-round-item--active' : '',
                isSelected ? 'admin-round-item--selected' : '',
              ].join(' ')}
            >
              <button
                type="button"
                className="admin-round-item__header"
                onClick={() => onSelectRound(round.id)}
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
                <div className="admin-round-state-controls">
                  <div className="admin-round-actions">
                    {round.adminOverride == null ? (
                      <>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => void setRoundOverride(contest.id, round.id, 'active')}
                        >
                          Force open
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => void setRoundOverride(contest.id, round.id, 'closed')}
                        >
                          Force close
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => void setRoundOverride(contest.id, round.id, null)}
                      >
                        Clear override ({round.adminOverride})
                      </button>
                    )}
                    {canSeed && (
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() =>
                          void (async () => {
                            if (index === 0) {
                              const pairs = autoPairEntries(contest.entries.map((e) => e.id));
                              if (pairs.length === 0) return;
                              await seedRound(contest.id, round.id, pairs);
                            } else {
                              await seedRound(contest.id, round.id);
                            }
                          })()
                        }
                      >
                        {roundMatchups.length > 0 ? 'Reseed round' : 'Seed round'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isSelected && roundMatchups.length > 0 && (
                <div className="admin-round-entries">
                  {roundMatchups.map((matchup) => (
                    <MatchupRow
                      key={matchup.id}
                      matchup={matchup}
                      maxScore={maxScore}
                      entriesById={entriesById}
                      onPhaseChange={(phase) =>
                        void updateMatchup(contest.id, matchup.id, { phase })
                      }
                    />
                  ))}
                </div>
              )}

              {isSelected && roundMatchups.length === 0 && (
                <p className="admin-detail-meta" style={{ padding: '0.5rem' }}>
                  No matchups yet. {canSeed ? 'Use "Seed round" to create them.' : 'Waiting on previous round to score.'}
                </p>
              )}

              <button
                type="button"
                className="button-secondary admin-round-item__remove"
                onClick={() => void removeRound(contest.id, round.id)}
                disabled={status === 'active'}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="admin-rounds-add">
        <button type="button" className="button-secondary" onClick={handleAddRound}>
          Add round
        </button>
      </div>
    </section>
  );
}

function MatchupRow({
  matchup,
  maxScore,
  entriesById,
  onPhaseChange,
}: {
  matchup: Matchup;
  maxScore: number;
  entriesById: Map<string, Contest['entries'][number]>;
  onPhaseChange: (phase: MatchupPhase) => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const entries = matchup.entryIds.map((id) => entriesById.get(id) ?? null);

  const handleChange = async (phase: MatchupPhase) => {
    setIsBusy(true);
    try {
      await onPhaseChange(phase);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="admin-round-entry">
      <div className="admin-round-entry__contestant">
        <strong>Matchup {matchup.slotIndex + 1}</strong>
        <span className="admin-round-entry__name">
          {entries.map((e, i) => {
            const label = e?.name || e?.submittedBy || 'TBD';
            const score = e ? getEntryScore(e) : null;
            const scoreSuffix = score !== null ? ` (${score}/${maxScore})` : '';
            return `${i === 0 ? '' : ' vs '}${label}${scoreSuffix}`;
          }).join('')}
        </span>
      </div>
      <div className="admin-phase-controls__grid admin-phase-controls__grid--compact">
        {MATCHUP_PHASE_VALUES.map((phaseOption) => {
          const isCurrent = phaseOption === matchup.phase;
          return (
            <button
              key={phaseOption}
              type="button"
              className={`admin-phase-button admin-phase-button--compact ${isCurrent ? 'admin-phase-button--active' : ''}`}
              onClick={() => void handleChange(phaseOption)}
              disabled={isBusy}
              aria-pressed={isCurrent}
            >
              <span className="admin-phase-button__label">{matchupPhaseLabels[phaseOption]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function autoPairEntries(entryIds: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i + 1 < entryIds.length; i += 2) {
    pairs.push([entryIds[i], entryIds[i + 1]]);
  }
  return pairs;
}
