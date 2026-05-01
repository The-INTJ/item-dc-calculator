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
import { pairWithByes } from '../../lib/domain/bracketMath';

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

  const entriesById = useMemo(
    () => new Map(contest.entries.map((e) => [e.id, e])),
    [contest.entries],
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
                            setSeedError(round.id, null);
                            const result = index === 0
                              ? await seedRound(
                                  contest.id,
                                  round.id,
                                  autoPairEntries(contest.entries.map((e) => e.id)),
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
                      entries={contest.entries}
                      entriesById={entriesById}
                      onPhaseChange={(phase) =>
                        void updateMatchup(contest.id, matchup.id, { phase })
                      }
                      onEntriesChange={(entryIds) =>
                        void updateMatchup(contest.id, matchup.id, { entryIds })
                      }
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
                  entries={contest.entries}
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

function MatchupRow({
  matchup,
  maxScore,
  entries: allEntries,
  entriesById,
  onPhaseChange,
  onEntriesChange,
  onDelete,
}: {
  matchup: Matchup;
  maxScore: number;
  entries: Contest['entries'];
  entriesById: Map<string, Contest['entries'][number]>;
  onPhaseChange: (phase: MatchupPhase) => void;
  onEntriesChange: (entryIds: string[]) => void | Promise<unknown>;
  onDelete: () => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftA, setDraftA] = useState(matchup.entryIds[0] ?? '');
  const [draftB, setDraftB] = useState(matchup.entryIds[1] ?? '');
  const [editError, setEditError] = useState<string | null>(null);
  const entries = matchup.entryIds.map((id) => entriesById.get(id) ?? null);

  const handlePhase = async (phase: MatchupPhase) => {
    setIsBusy(true);
    try {
      await onPhaseChange(phase);
    } finally {
      setIsBusy(false);
    }
  };

  const isBye = matchup.entryIds.length === 1;
  const isScored = matchup.phase === 'scored';

  const startEdit = () => {
    setDraftA(matchup.entryIds[0] ?? '');
    setDraftB(matchup.entryIds[1] ?? '');
    setEditError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!draftA) {
      setEditError('Entry A is required.');
      return;
    }
    if (draftB && draftA === draftB) {
      setEditError('Entries must be different.');
      return;
    }
    setIsBusy(true);
    try {
      const next = draftB ? [draftA, draftB] : [draftA];
      await onEntriesChange(next);
      setIsEditing(false);
      setEditError(null);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="admin-round-entry">
      <div className="admin-round-entry__contestant">
        <strong>
          Matchup {matchup.slotIndex + 1}
          {isBye && <span className="admin-round-bye-badge"> Bye</span>}
        </strong>
        {isEditing ? (
          <div className="admin-round-entry__edit">
            <select
              value={draftA}
              onChange={(e) => setDraftA(e.target.value)}
              disabled={isBusy}
            >
              <option value="">— Select entry A —</option>
              {allEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name || entry.submittedBy || entry.id}
                </option>
              ))}
            </select>
            <span className="admin-round-entry__vs">vs</span>
            <select
              value={draftB}
              onChange={(e) => setDraftB(e.target.value)}
              disabled={isBusy}
            >
              <option value="">— None (bye) —</option>
              {allEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name || entry.submittedBy || entry.id}
                </option>
              ))}
            </select>
            <div className="admin-round-entry__edit-actions">
              <button
                type="button"
                className="button-primary"
                onClick={() => void saveEdit()}
                disabled={isBusy}
              >
                Save
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEdit}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
            {editError && (
              <p className="admin-round-error" role="alert">
                {editError}
              </p>
            )}
          </div>
        ) : (
          <span className="admin-round-entry__name">
            {isBye
              ? `${entries[0]?.name || entries[0]?.submittedBy || 'TBD'} (auto-advance)`
              : entries.map((e, i) => {
                  const label = e?.name || e?.submittedBy || 'TBD';
                  const score = e ? getEntryScore(e) : null;
                  const scoreSuffix = score !== null ? ` (${score}/${maxScore})` : '';
                  return `${i === 0 ? '' : ' vs '}${label}${scoreSuffix}`;
                }).join('')}
          </span>
        )}
      </div>
      {!isBye && !isEditing && (
        <div className="admin-phase-controls__grid admin-phase-controls__grid--compact">
          {MATCHUP_PHASE_VALUES.map((phaseOption) => {
            const isCurrent = phaseOption === matchup.phase;
            return (
              <button
                key={phaseOption}
                type="button"
                className={`admin-phase-button admin-phase-button--compact ${isCurrent ? 'admin-phase-button--active' : ''}`}
                onClick={() => void handlePhase(phaseOption)}
                disabled={isBusy}
                aria-pressed={isCurrent}
              >
                <span className="admin-phase-button__label">{matchupPhaseLabels[phaseOption]}</span>
              </button>
            );
          })}
        </div>
      )}
      {!isEditing && (
        <div className="admin-round-entry__actions">
          <button
            type="button"
            className="button-secondary"
            onClick={startEdit}
            disabled={isBusy || isScored}
          >
            Edit entries
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={onDelete}
            disabled={isBusy || isScored}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function AddMatchupForm({
  entries,
  nextSlotIndex,
  onSubmit,
}: {
  entries: Contest['entries'];
  nextSlotIndex: number;
  onSubmit: (input: {
    slotIndex: number;
    entryIds: string[];
    phase?: MatchupPhase;
    winnerEntryId?: string | null;
  }) => Promise<Matchup | null>;
}) {
  const [open, setOpen] = useState(false);
  const [entryA, setEntryA] = useState('');
  const [entryB, setEntryB] = useState('');
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
            setEntryA('');
            setEntryB('');
            setIsBye(false);
            setError(null);
            setOpen(true);
          }}
          disabled={entries.length === 0}
        >
          Add matchup
        </button>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!entryA) {
      setError('Entry A is required.');
      return;
    }
    if (!isBye && !entryB) {
      setError('Pick a second entry, or check "Bye".');
      return;
    }
    if (!isBye && entryA === entryB) {
      setError('Entries must be different.');
      return;
    }
    setIsBusy(true);
    try {
      const result = isBye
        ? await onSubmit({
            slotIndex: nextSlotIndex,
            entryIds: [entryA],
            phase: 'scored',
            winnerEntryId: entryA,
          })
        : await onSubmit({
            slotIndex: nextSlotIndex,
            entryIds: [entryA, entryB],
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
          value={entryA}
          onChange={(e) => setEntryA(e.target.value)}
          disabled={isBusy}
        >
          <option value="">— Select entry —</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name || entry.submittedBy || entry.id}
            </option>
          ))}
        </select>
        <span className="admin-round-entry__vs">vs</span>
        <select
          value={entryB}
          onChange={(e) => setEntryB(e.target.value)}
          disabled={isBusy || isBye}
        >
          <option value="">— Select entry —</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name || entry.submittedBy || entry.id}
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
            if (e.target.checked) setEntryB('');
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

function autoPairEntries(entryIds: string[]): Array<[string, string] | [string]> {
  const { pairs, byeId } = pairWithByes(entryIds);
  const slots: Array<[string, string] | [string]> = [...pairs];
  if (byeId) slots.push([byeId]);
  return slots;
}
