'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type {
  Contest,
  Contestant,
  Entry,
  Matchup,
  ScoreEntry,
  UserRole,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { MaterialSymbol } from '../ui/MaterialSymbol';

interface AdminContestantsProps {
  contest: Contest;
  matchups: Matchup[];
  contestScores: ScoreEntry[];
}

interface MatchupEntryRef {
  matchup: Matchup;
  entry: Entry;
  roundId: string;
  roundIndex: number;
}

interface ParticipantDetails {
  id: string;
  contestantId: string | null;
  displayName: string;
  role: UserRole;
  entries: MatchupEntryRef[];
  totalRounds: number;
  votedRoundCount: number;
}

function ContestantCard({
  participant,
  rounds,
  expanded,
  onToggle,
  onSetEntryName,
  onRemoveContestant,
}: {
  participant: ParticipantDetails;
  rounds: Contest['rounds'];
  expanded: boolean;
  onToggle: () => void;
  onSetEntryName: (matchupId: string, entryId: string, name: string) => Promise<boolean>;
  onRemoveContestant: (() => Promise<void>) | null;
}) {
  const namedCount = participant.entries.filter((e) => e.entry.name?.trim()).length;
  const placementSummary =
    participant.entries.length === 0
      ? 'Not placed yet'
      : `${namedCount}/${participant.entries.length} entries named`;

  return (
    <li className={`admin-participant-card${expanded ? ' admin-participant-card--expanded' : ''}`}>
      <button
        type="button"
        className="admin-participant-card__header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="admin-participant-card__identity">
          <strong className="admin-participant-card__name">{participant.displayName}</strong>
          <div className="admin-participant-card__badges">
            <span className={`admin-role-badge admin-role-badge--${participant.role}`}>
              {participant.role}
            </span>
            {participant.contestantId && (
              <span className="admin-role-badge admin-role-badge--contestant">contestant</span>
            )}
          </div>
        </div>
        <div className="admin-participant-card__summary">
          <span className="admin-detail-meta">{placementSummary}</span>
          <MaterialSymbol
            name={expanded ? 'expand_less' : 'expand_more'}
            className="admin-participant-card__chevron"
          />
        </div>
      </button>

      {expanded && (
        <div className="admin-participant-card__body">
          <section className="admin-participant-section">
            <header className="admin-participant-section__header">
              <h4>Per-matchup entries</h4>
            </header>
            {participant.entries.length === 0 ? (
              <p className="admin-empty">Not placed in any matchups yet.</p>
            ) : (
              <ul className="admin-entry-list">
                {participant.entries.map(({ matchup, entry, roundIndex }) => (
                  <MatchupEntryEditor
                    key={entry.id}
                    matchup={matchup}
                    entry={entry}
                    roundLabel={rounds?.[roundIndex]?.name || `Round ${roundIndex + 1}`}
                    onSubmit={(name) => onSetEntryName(matchup.id, entry.id, name)}
                  />
                ))}
              </ul>
            )}
          </section>

          {onRemoveContestant && (
            <div className="admin-entry-add">
              <Button variant="danger" onClick={() => void onRemoveContestant()}>
                Remove contestant
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function MatchupEntryEditor({
  matchup,
  entry,
  roundLabel,
  onSubmit,
}: {
  matchup: Matchup;
  entry: Entry;
  roundLabel: string;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(entry.name ?? '');
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === (entry.name?.trim() ?? '')) return;
    if (!trimmed) return;
    setBusy(true);
    await onSubmit(trimmed);
    setBusy(false);
  };

  return (
    <li className="admin-entry-row">
      <input
        className="admin-contestant-input admin-entry-row__name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        placeholder="Entry name (e.g. drink name)"
        disabled={busy}
      />
      <span className="admin-entry-row__placement">
        {roundLabel} · Matchup {matchup.slotIndex + 1}
      </span>
    </li>
  );
}

export function AdminContestants({ contest, matchups }: AdminContestantsProps) {
  const { removeContestant, setMatchupEntryName } = useContestStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const rounds = contest.rounds ?? [];
  const contestants = contest.contestants ?? [];
  const voters = contest.voters ?? [];

  const entriesByContestantId = useMemo(() => {
    const map = new Map<string, MatchupEntryRef[]>();
    for (const matchup of matchups) {
      const roundIndex = rounds.findIndex((r) => r.id === matchup.roundId);
      for (const entry of matchup.entries ?? []) {
        const key = entry.contestantId;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ matchup, entry, roundId: matchup.roundId, roundIndex });
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.roundIndex - b.roundIndex || a.matchup.slotIndex - b.matchup.slotIndex);
    }
    return map;
  }, [matchups, rounds]);

  const participants = useMemo<ParticipantDetails[]>(() => {
    const list: ParticipantDetails[] = [];
    const seenContestantIds = new Set<string>();

    // Build contestant entries first (they're the per-matchup competitors)
    for (const c of contestants) {
      seenContestantIds.add(c.id);
      const linkedVoter = c.userId ? voters.find((v) => v.id === c.userId) : null;
      list.push({
        id: c.id,
        contestantId: c.id,
        displayName: c.displayName,
        role: linkedVoter?.role ?? 'competitor',
        entries: entriesByContestantId.get(c.id) ?? [],
        totalRounds: rounds.length,
        votedRoundCount: 0,
      });
    }

    // Append voters who are NOT contestants (so admin can see vote participation later)
    const linkedUserIds = new Set(contestants.map((c) => c.userId).filter(Boolean) as string[]);
    for (const voter of voters) {
      if (linkedUserIds.has(voter.id)) continue;
      list.push({
        id: voter.id,
        contestantId: null,
        displayName: voter.displayName,
        role: voter.role,
        entries: [],
        totalRounds: rounds.length,
        votedRoundCount: 0,
      });
    }

    return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [contestants, voters, entriesByContestantId, rounds.length]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSetEntryName = async (matchupId: string, entryId: string, name: string): Promise<boolean> => {
    setActionError(null);
    const result = await setMatchupEntryName(contest.id, matchupId, entryId, { name });
    if (!result) {
      setActionError('Failed to update entry');
      return false;
    }
    return true;
  };

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
          {participants.map((participant) => {
            const removeFn: (() => Promise<void>) | null = participant.contestantId
              ? async () => {
                  if (!window.confirm(`Remove contestant ${participant.displayName}?`)) return;
                  setActionError(null);
                  const ok = await removeContestant(contest.id, participant.contestantId!);
                  if (!ok) setActionError('Failed to remove contestant');
                }
              : null;
            return (
              <ContestantCard
                key={participant.id}
                participant={participant}
                rounds={rounds}
                expanded={expandedIds.has(participant.id)}
                onToggle={() => toggleExpanded(participant.id)}
                onSetEntryName={handleSetEntryName}
                onRemoveContestant={removeFn}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
