'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  Contest,
  Contestant,
  ContestConfig,
  Entry,
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
import { pairWithByes } from '../../lib/domain/bracketMath';
import { getEntryDisplayName } from '../../lib/domain/entryLabels';

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

function formatEntryDisplay(entry: Entry, contestant: Contestant | null): string {
  const drink = entry.name?.trim();
  const name = contestant?.displayName ?? 'TBD';
  if (drink) return `${name}: ${drink}`;
  return `${name} — ${getEntryDisplayName(entry, contestant) ?? 'no entry yet'}`;
}

export function AdminContestRounds({
  contest,
  config,
  matchups,
  selectedRoundId,
  onSelectRound,
}: AdminContestRoundsProps) {
  const {
    addRound,
    removeRound,
    setRoundOverride,
    updateMatchup,
    seedRound,
    createMatchup,
    deleteMatchup,
  } = useContestStore();

  const rounds = contest.rounds ?? [];
  const maxScore = config.attributes.reduce((sum, a) => sum + (a.max ?? 10), 0);

  const contestantsById = useMemo(
    () => new Map(contest.contestants.map((c) => [c.id, c])),
    [contest.contestants],
  );

  const [seedErrorByRound, setSeedErrorByRound] = useState<Record<string, string>>({});
  const setSeedError = (roundId: string, error: string | null) => {
    setSeedErrorByRound((prev) => {
      if (error == null) {
        if (!(roundId in prev)) return prev;
        const next = { ...prev };
        delete next[roundId];
        return next;
      }
      return { ...prev, [roundId]: error };
    });
  };

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
            ? contest.contestants.length >= 2
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
                            setSeedError(round.id, null);
                            const result = index === 0
                              ? await seedRound(
                                  contest.id,
                                  round.id,
                                  autoPairContestants(contest.contestants.map((c) => c.id)),
                                )
                              : await seedRound(contest.id, round.id);
                            if (result.error) setSeedError(round.id, result.error);
                          })()
                        }
                      >
                        {roundMatchups.length > 0 ? 'Reseed round' : 'Seed round'}
                      </button>
                    )}
                  </div>
                  {seedErrorByRound[round.id] && (
                    <p className="admin-round-error" role="alert">
                      {seedErrorByRound[round.id]}
                    </p>
                  )}
                </div>
              )}

              {isSelected && roundMatchups.length > 0 && (
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

              {isSelected && roundMatchups.length === 0 && (
                <p className="admin-detail-meta" style={{ padding: '0.5rem' }}>
                  No matchups yet. {canSeed ? 'Use "Seed round" to create them.' : 'Waiting on previous round to score.'}
                </p>
              )}

              {isSelected && (
                <AddMatchupForm
                  contestants={contest.contestants}
                  nextSlotIndex={roundMatchups.length}
                  onSubmit={(input) =>
                    createMatchup(contest.id, { roundId: round.id, ...input })
                  }
                />
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

function getLeadingEntryId(entries: Entry[]): string | null {
  let leaderId: string | null = null;
  let leaderScore = Number.NEGATIVE_INFINITY;
  let tied = false;

  for (const entry of entries) {
    const score = getEntryScore(entry);
    if (score == null) continue;
    if (score > leaderScore) {
      leaderId = entry.id;
      leaderScore = score;
      tied = false;
    } else if (score === leaderScore) {
      tied = true;
    }
  }

  return tied ? null : leaderId;
}

function MatchupRow({
  matchup,
  maxScore,
  contestantsById,
  onMatchupUpdate,
  onDelete,
}: {
  matchup: Matchup;
  maxScore: number;
  contestantsById: Map<string, Contestant>;
  onMatchupUpdate: (updates: Partial<Matchup>) => void | Promise<unknown>;
  onDelete: () => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [draftWinnerId, setDraftWinnerId] = useState(matchup.winnerEntryId ?? '');
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const entries = matchup.entries ?? [];
  const leadingEntryId = getLeadingEntryId(entries);
  const matchupNumber = matchup.slotIndex + 1;
  const isBye = entries.length === 1;
  const isScored = matchup.phase === 'scored';
  const allEntriesNamed = entries.every((e) => e.name?.trim());
  const missingEntryCount = entries.filter((e) => !e.name?.trim()).length;

  useEffect(() => {
    setDraftWinnerId(matchup.winnerEntryId ?? leadingEntryId ?? '');
  }, [matchup.id, matchup.winnerEntryId, leadingEntryId]);

  const handlePhase = async (phase: MatchupPhase) => {
    const winnerEntryId = phase === 'scored' ? draftWinnerId || leadingEntryId : null;
    if (phase === 'scored' && !winnerEntryId) {
      setPhaseError('Choose a winner before closing this matchup.');
      return;
    }

    setIsBusy(true);
    setPhaseError(null);
    try {
      await onMatchupUpdate({ phase, winnerEntryId });
    } finally {
      setIsBusy(false);
    }
  };

  const handleWinnerChange = async (winnerEntryId: string) => {
    setDraftWinnerId(winnerEntryId);
    setPhaseError(null);
    if (matchup.phase !== 'scored') return;

    setIsBusy(true);
    try {
      await onMatchupUpdate({ winnerEntryId });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="admin-round-entry" role="group" aria-label={`Matchup ${matchupNumber}`}>
      <div className="admin-round-entry__contestant">
        <strong>
          Matchup {matchupNumber}
          {isBye && <span className="admin-round-bye-badge"> Bye</span>}
        </strong>
        <span className="admin-round-entry__name">
          {entries.map((entry, i) => {
            const label = formatEntryDisplay(entry, contestantsById.get(entry.contestantId) ?? null);
            const score = getEntryScore(entry);
            const scoreSuffix = score !== null ? ` (${score}/${maxScore})` : '';
            return `${i === 0 ? '' : ' vs '}${label}${scoreSuffix}`;
          }).join('')}
        </span>
        {!isBye && !allEntriesNamed && (
          <p className="admin-detail-meta" role="status">
            {missingEntryCount} contestant{missingEntryCount === 1 ? '' : 's'} still need to name their entry — voters will see a placeholder until they do.
          </p>
        )}
      </div>
      {!isBye && (
        <>
          <label className="admin-round-entry__winner">
            <span>Winner</span>
            <select
              aria-label={`Winner for matchup ${matchupNumber}`}
              value={draftWinnerId}
              onChange={(e) => void handleWinnerChange(e.target.value)}
              disabled={isBusy}
            >
              <option value="">Select winner</option>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {formatEntryDisplay(entry, contestantsById.get(entry.contestantId) ?? null)}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-phase-controls__grid admin-phase-controls__grid--compact">
            {MATCHUP_PHASE_VALUES.map((phaseOption) => {
              const isCurrent = phaseOption === matchup.phase;
              const disabled = isBusy;
              return (
                <button
                  key={phaseOption}
                  type="button"
                  className={`admin-phase-button admin-phase-button--compact ${isCurrent ? 'admin-phase-button--active' : ''}`}
                  onClick={() => void handlePhase(phaseOption)}
                  disabled={disabled}
                  aria-label={`Mark matchup ${matchupNumber} as ${matchupPhaseLabels[phaseOption]}`}
                  aria-pressed={isCurrent}
                >
                  <span className="admin-phase-button__label">{matchupPhaseLabels[phaseOption]}</span>
                </button>
              );
            })}
          </div>
          {phaseError && (
            <p className="admin-round-error" role="alert">
              {phaseError}
            </p>
          )}
        </>
      )}
      <div className="admin-round-entry__actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onDelete}
          disabled={isBusy || isScored}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function AddMatchupForm({
  contestants,
  nextSlotIndex,
  onSubmit,
}: {
  contestants: Contestant[];
  nextSlotIndex: number;
  onSubmit: (input: {
    slotIndex: number;
    contestantIds: string[];
    phase?: MatchupPhase;
    winnerEntryId?: string | null;
  }) => Promise<Matchup | null>;
}) {
  const [open, setOpen] = useState(false);
  const [contestantA, setContestantA] = useState('');
  const [contestantB, setContestantB] = useState('');
  const [isBye, setIsBye] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!open) {
    return (
      <div className="admin-round-add-matchup">
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setContestantA('');
            setContestantB('');
            setIsBye(false);
            setError(null);
            setOpen(true);
          }}
          disabled={contestants.length === 0}
        >
          Add matchup
        </button>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!contestantA) {
      setError('Contestant A is required.');
      return;
    }
    if (!isBye && !contestantB) {
      setError('Pick a second contestant, or check "Bye".');
      return;
    }
    if (!isBye && contestantA === contestantB) {
      setError('Contestants must be different.');
      return;
    }
    setIsBusy(true);
    try {
      const result = isBye
        ? await onSubmit({
            slotIndex: nextSlotIndex,
            contestantIds: [contestantA],
            phase: 'scored',
          })
        : await onSubmit({
            slotIndex: nextSlotIndex,
            contestantIds: [contestantA, contestantB],
            phase: 'set',
          });
      if (!result) {
        setError('Failed to create matchup.');
        return;
      }
      setOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="admin-round-add-matchup admin-round-add-matchup--open">
      <div className="admin-round-add-matchup__row">
        <select
          value={contestantA}
          onChange={(e) => setContestantA(e.target.value)}
          disabled={isBusy}
        >
          <option value="">— Select contestant —</option>
          {contestants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
        <span className="admin-round-entry__vs">vs</span>
        <select
          value={contestantB}
          onChange={(e) => setContestantB(e.target.value)}
          disabled={isBusy || isBye}
        >
          <option value="">— Select contestant —</option>
          {contestants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>
      <label className="admin-round-add-matchup__bye">
        <input
          type="checkbox"
          checked={isBye}
          onChange={(e) => {
            setIsBye(e.target.checked);
            if (e.target.checked) setContestantB('');
          }}
          disabled={isBusy}
        />
        Bye / auto-advance
      </label>
      {error && (
        <p className="admin-round-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-round-add-matchup__actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => void submit()}
          disabled={isBusy}
        >
          Create
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={isBusy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function autoPairContestants(contestantIds: string[]): Array<[string, string] | [string]> {
  const { pairs, byeId } = pairWithByes(contestantIds);
  const slots: Array<[string, string] | [string]> = [...pairs];
  if (byeId) slots.push([byeId]);
  return slots;
}
