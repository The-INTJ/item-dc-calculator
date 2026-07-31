'use client';

import { useEffect, useState } from 'react';
import type {
  Contestant,
  Entry,
  Matchup,
  MatchupPhase,
} from '../../contexts/contest/contestTypes';
import { getEntryScore } from '../../lib/domain/contestGetters';
import {
  MATCHUP_PHASE_VALUES,
  matchupPhaseLabels,
} from '../../lib/domain/matchupPhases';
import { getEntryDisplayName } from '../../lib/domain/entryLabels';
import { resolveMatchupWinner } from '../../lib/domain/winnerResolution';

function formatEntryDisplay(entry: Entry, contestant: Contestant | null): string {
  const drink = entry.name?.trim();
  const name = contestant?.displayName ?? 'TBD';
  if (drink) return `${name}: ${drink}`;
  return `${name} — ${getEntryDisplayName(entry, contestant) ?? 'no entry yet'}`;
}

function getLeadingEntryId(entries: Entry[]): string | null {
  const resolution = resolveMatchupWinner({ entries });
  return resolution.ok ? resolution.winnerEntryId : null;
}

type MatchupUpdateHandler = (updates: Partial<Matchup>) => void | Promise<unknown>;

/**
 * Winner drafting plus phase transitions for a single matchup.
 */
function useMatchupWinnerControls(matchup: Matchup, onMatchupUpdate: MatchupUpdateHandler) {
  const [isBusy, setIsBusy] = useState(false);
  const [draftWinnerId, setDraftWinnerId] = useState(matchup.winnerEntryId ?? '');
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const entries = matchup.entries ?? [];
  const leadingEntryId = getLeadingEntryId(entries);

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

  return { isBusy, draftWinnerId, phaseError, handlePhase, handleWinnerChange };
}

function MatchupPhaseButtons({
  matchupNumber,
  currentPhase,
  isBusy,
  onPhase,
}: {
  matchupNumber: number;
  currentPhase: MatchupPhase;
  isBusy: boolean;
  onPhase: (phase: MatchupPhase) => Promise<void>;
}) {
  return (
    <div className="admin-phase-controls__grid admin-phase-controls__grid--compact">
      {MATCHUP_PHASE_VALUES.map((phaseOption) => {
        const isCurrent = phaseOption === currentPhase;
        const disabled = isBusy;
        return (
          <button
            key={phaseOption}
            type="button"
            className={`admin-phase-button admin-phase-button--compact ${isCurrent ? 'admin-phase-button--active' : ''}`}
            onClick={() => void onPhase(phaseOption)}
            disabled={disabled}
            aria-label={`Mark matchup ${matchupNumber} as ${matchupPhaseLabels[phaseOption]}`}
            aria-pressed={isCurrent}
          >
            <span className="admin-phase-button__label">{matchupPhaseLabels[phaseOption]}</span>
          </button>
        );
      })}
    </div>
  );
}

interface MatchupRowProps {
  matchup: Matchup;
  maxScore: number;
  contestantsById: Map<string, Contestant>;
  onMatchupUpdate: MatchupUpdateHandler;
  onDelete: () => void;
}

export function MatchupRow({
  matchup,
  maxScore,
  contestantsById,
  onMatchupUpdate,
  onDelete,
}: MatchupRowProps) {
  const { isBusy, draftWinnerId, phaseError, handlePhase, handleWinnerChange } =
    useMatchupWinnerControls(matchup, onMatchupUpdate);
  const entries = matchup.entries ?? [];
  const matchupNumber = matchup.slotIndex + 1;
  const isBye = entries.length === 1;
  const isScored = matchup.phase === 'scored';
  const allEntriesNamed = entries.every((e) => e.name?.trim());
  const missingEntryCount = entries.filter((e) => !e.name?.trim()).length;

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
          <MatchupPhaseButtons
            matchupNumber={matchupNumber}
            currentPhase={matchup.phase}
            isBusy={isBusy}
            onPhase={handlePhase}
          />
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
