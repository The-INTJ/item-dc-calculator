'use client';

import { useMemo } from 'react';
import { ConfirmDialog } from '@/components/ui';
import type { Contest, Matchup, ScoreEntry } from '../../contexts/contest/contestTypes';
import { AddContestantForm } from './AddContestantForm';
import { ContestantCard } from './ContestantCard';
import {
  buildEntriesByContestantId,
  buildParticipants,
  type ParticipantDetails,
} from './participantDetails';
import { useContestantActions } from './useContestantActions';

interface AdminContestantsProps {
  contest: Contest;
  matchups: Matchup[];
  contestScores: ScoreEntry[];
}

export function AdminContestants({ contest, matchups, contestScores }: AdminContestantsProps) {
  const {
    expandedIds,
    actionError,
    pendingRemoval,
    setPendingRemoval,
    toggleExpanded,
    handleSetEntryName,
    handleAddContestant,
    confirmRemoval,
  } = useContestantActions(contest);

  const rounds = contest.rounds ?? [];
  const contestants = contest.contestants ?? [];
  const voters = contest.voters ?? [];
  const firstRoundSeeded = rounds.length > 0 && matchups.some((m) => m.roundId === rounds[0].id);

  const entriesByContestantId = useMemo(
    () => buildEntriesByContestantId(matchups, rounds),
    [matchups, rounds],
  );

  const participants = useMemo<ParticipantDetails[]>(
    () =>
      buildParticipants(contestants, voters, entriesByContestantId, rounds, matchups, contestScores),
    [contestants, voters, entriesByContestantId, rounds, matchups, contestScores],
  );

  return (
    <section className="admin-details-section">
      <header className="admin-participants-header">
        <h3>Participants ({participants.length})</h3>
      </header>

      {actionError && (
        <p className="admin-phase-controls__message--error">{actionError}</p>
      )}

      {participants.length === 0 ? (
        <p className="admin-empty">No participants yet.</p>
      ) : (
        <ul className="admin-participants-list">
          {participants.map((participant) => (
            <ContestantCard
              key={participant.id}
              participant={participant}
              rounds={rounds}
              expanded={expandedIds.has(participant.id)}
              onToggle={() => toggleExpanded(participant.id)}
              onSetEntryName={handleSetEntryName}
              onRemoveContestant={
                participant.contestantId ? () => setPendingRemoval(participant) : null
              }
            />
          ))}
        </ul>
      )}

      <AddContestantForm firstRoundSeeded={firstRoundSeeded} onSubmit={handleAddContestant} />

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove contestant?"
        message={
          pendingRemoval
            ? `Removes ${pendingRemoval.displayName}'s ${pendingRemoval.entries.length === 1 ? 'entry' : 'entries'} from ${pendingRemoval.entries.length} matchup${pendingRemoval.entries.length === 1 ? '' : 's'} and recalculates winners (an abandoned opponent auto-advances as a bye). Votes they cast on other entries are kept. This cannot be undone.`
            : ''
        }
        confirmLabel="Yes, remove"
        cancelLabel="Keep contestant"
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </section>
  );
}
