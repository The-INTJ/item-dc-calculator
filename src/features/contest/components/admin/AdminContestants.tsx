'use client';

import { useMemo, useState } from 'react';
import type {
  Contest,
  Entry,
  Matchup,
  ScoreEntry,
  UserRole,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';

interface AdminContestantsProps {
  contest: Contest;
  matchups: Matchup[];
  contestScores: ScoreEntry[];
}

interface ParticipantEntry {
  entry: Entry;
  placement: { roundId: string; roundIndex: number } | null;
}

type VoteStatus = 'voted' | 'partial' | 'not-voted' | 'auto-max' | 'not-open';

interface RoundParticipation {
  roundId: string;
  roundIndex: number;
  label: string;
  status: VoteStatus;
  votedCount: number;
  expectedCount: number;
  isCompetitor: boolean;
}

interface ParticipantDetails {
  id: string;
  displayName: string;
  role: UserRole;
  entries: ParticipantEntry[];
  competitorRoundIndexes: number[];
  voteRounds: RoundParticipation[];
  votedRoundCount: number;
  totalRounds: number;
}

type Filter = 'all' | 'no-entry' | 'unplaced' | string;

const VOTE_STATUS_LABEL: Record<VoteStatus, string> = {
  voted: 'Voted',
  partial: 'Partial',
  'not-voted': 'Not voted',
  'auto-max': 'Auto max',
  'not-open': 'Not open',
};

function EntryEditor({
  entry,
  placementLabel,
  onUpdate,
  onRemove,
}: {
  entry: Entry;
  placementLabel: string;
  onUpdate: (updates: Partial<Entry>) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [draft, setDraft] = useState(entry.name ?? '');

  const commit = async () => {
    if (draft === (entry.name ?? '')) return;
    setUpdating(true);
    await onUpdate({ name: draft });
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove();
  };

  const disabled = updating || removing;

  return (
    <li className="admin-entry-row">
      <input
        className="admin-contestant-input admin-entry-row__name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        placeholder="Entry name"
        disabled={disabled}
      />
      <span className="admin-entry-row__placement">{placementLabel}</span>
      <button
        type="button"
        className="admin-inline-button admin-inline-button--danger"
        onClick={handleRemove}
        disabled={disabled}
      >
        {removing ? 'Removing...' : 'Remove'}
      </button>
    </li>
  );
}

function AddEntryForm({
  onAdd,
  disabled,
}: {
  onAdd: (entryName: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    const ok = await onAdd(name.trim());
    if (ok) setName('');
    setLoading(false);
  };

  return (
    <div className="admin-entry-add">
      <input
        className="admin-contestant-input"
        placeholder="Entry name (optional)"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={disabled || loading}
      />
      <button
        type="button"
        className="admin-inline-button admin-inline-button--primary"
        onClick={handleAdd}
        disabled={disabled || loading}
      >
        {loading ? 'Adding...' : 'Add entry'}
      </button>
    </div>
  );
}

function RoundVoteRow({ round }: { round: RoundParticipation }) {
  const statusClass = `admin-vote-status admin-vote-status--${
    round.status === 'auto-max' ? 'auto' : round.status === 'voted' ? 'voted' : round.status === 'partial' ? 'partial' : 'pending'
  }`;
  const detail =
    round.status === 'auto-max'
      ? 'Competing this round'
      : round.expectedCount > 0
        ? `${round.votedCount} of ${round.expectedCount}`
        : '';

  return (
    <li className="admin-round-vote-row">
      <span className="admin-round-vote-row__label">
        <strong>{round.label}</strong>
        {round.isCompetitor && (
          <span className="admin-inline-chip admin-inline-chip--competitor">competing</span>
        )}
      </span>
      <span className="admin-round-vote-row__detail">
        <span className={statusClass}>{VOTE_STATUS_LABEL[round.status]}</span>
        {detail && <span className="admin-detail-meta">{detail}</span>}
      </span>
    </li>
  );
}

function ParticipantCard({
  participant,
  expanded,
  onToggle,
  onUpdateEntry,
  onRemoveEntry,
  onAddEntry,
}: {
  participant: ParticipantDetails;
  expanded: boolean;
  onToggle: () => void;
  onUpdateEntry: (entryId: string, updates: Partial<Entry>) => Promise<void>;
  onRemoveEntry: (entryId: string) => Promise<void>;
  onAddEntry: (entryName: string) => Promise<boolean>;
}) {
  const [votesOpen, setVotesOpen] = useState(false);
  const voteSummary =
    participant.totalRounds > 0
      ? `${participant.votedRoundCount} of ${participant.totalRounds} rounds`
      : 'No rounds yet';
  const entrySummary =
    participant.entries.length === 0
      ? 'No entry'
      : participant.entries.length === 1
        ? '1 entry'
        : `${participant.entries.length} entries`;

  return (
    <li
      className={`admin-participant-card${expanded ? ' admin-participant-card--expanded' : ''}`}
    >
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
            {participant.entries.length > 0 && (
              <span className="admin-role-badge admin-role-badge--contestant">contestant</span>
            )}
          </div>
        </div>
        <div className="admin-participant-card__summary">
          <span className="admin-detail-meta">{entrySummary}</span>
          <span className="admin-detail-meta">{voteSummary}</span>
          <span className="admin-participant-card__chevron" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="admin-participant-card__body">
          <section className="admin-participant-section">
            <header className="admin-participant-section__header">
              <h4>Entries</h4>
              {participant.competitorRoundIndexes.length > 0 && (
                <span className="admin-detail-meta">
                  Competing in{' '}
                  {participant.competitorRoundIndexes
                    .map((i) => `Round ${i + 1}`)
                    .join(', ')}
                </span>
              )}
            </header>
            {participant.entries.length === 0 ? (
              <p className="admin-empty">No entries assigned.</p>
            ) : (
              <ul className="admin-entry-list">
                {participant.entries.map(({ entry, placement }) => (
                  <EntryEditor
                    key={entry.id}
                    entry={entry}
                    placementLabel={
                      placement ? `Round ${placement.roundIndex + 1}` : 'Unplaced'
                    }
                    onUpdate={(updates) => onUpdateEntry(entry.id, updates)}
                    onRemove={() => onRemoveEntry(entry.id)}
                  />
                ))}
              </ul>
            )}
            <AddEntryForm onAdd={onAddEntry} />
          </section>

          {participant.voteRounds.length > 0 && (
            <section className="admin-participant-section">
              <button
                type="button"
                className="admin-participant-section__toggle"
                onClick={() => setVotesOpen((open) => !open)}
                aria-expanded={votesOpen}
              >
                <h4>Voting</h4>
                <span className="admin-detail-meta">{voteSummary}</span>
                <span className="admin-participant-card__chevron" aria-hidden="true">
                  {votesOpen ? '▲' : '▼'}
                </span>
              </button>
              {votesOpen && (
                <ul className="admin-round-vote-list">
                  {participant.voteRounds.map((round) => (
                    <RoundVoteRow key={round.roundId} round={round} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </li>
  );
}

export function AdminContestants({ contest, matchups, contestScores }: AdminContestantsProps) {
  const { addContestant, updateContestant, removeContestant } = useContestStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const rounds = contest.rounds ?? [];
  const entries = contest.entries ?? [];
  const voters = contest.voters ?? [];

  const placementByEntryId = useMemo(() => {
    const map = new Map<string, { roundId: string; roundIndex: number }>();
    for (const matchup of matchups) {
      const roundIndex = rounds.findIndex((r) => r.id === matchup.roundId);
      for (const entryId of matchup.entryIds) {
        map.set(entryId, { roundId: matchup.roundId, roundIndex });
      }
    }
    return map;
  }, [matchups, rounds]);

  const participants = useMemo<ParticipantDetails[]>(() => {
    const entriesByName = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = entry.submittedBy?.toLowerCase() ?? '';
      if (!key) continue;
      if (!entriesByName.has(key)) entriesByName.set(key, []);
      entriesByName.get(key)!.push(entry);
    }

    const roundsMeta = rounds.map((round, index) => {
      const roundMatchups = matchups.filter((m) => m.roundId === round.id);
      const roundEntryIds = new Set(roundMatchups.flatMap((m) => m.entryIds));
      const matchupIdsForRound = new Set(roundMatchups.map((m) => m.id));
      const isVotingOpen = roundMatchups.some((m) => m.phase === 'shake');
      const isShakeOrScored = roundMatchups.some(
        (m) => m.phase === 'shake' || m.phase === 'scored',
      );
      return {
        round,
        index,
        roundEntryIds,
        matchupIdsForRound,
        isVotingOpen,
        isShakeOrScored,
      };
    });

    const build = (id: string, displayName: string, role: UserRole): ParticipantDetails => {
      const participantEntries: ParticipantEntry[] =
        (entriesByName.get(displayName.toLowerCase()) ?? []).map((entry) => ({
          entry,
          placement: placementByEntryId.get(entry.id) ?? null,
        }));

      const competitorRoundIndexes = Array.from(
        new Set(
          participantEntries
            .map((pe) => pe.placement?.roundIndex)
            .filter((i): i is number => typeof i === 'number'),
        ),
      ).sort((a, b) => a - b);

      const voteRounds: RoundParticipation[] = roundsMeta.map((meta) => {
        const isCompetitor = participantEntries.some(
          (pe) => pe.placement?.roundId === meta.round.id,
        );
        const expectedCount = Math.max(
          0,
          meta.roundEntryIds.size -
            participantEntries.filter((pe) => pe.placement?.roundId === meta.round.id).length,
        );

        let votedCount = 0;
        for (const score of contestScores) {
          if (score.userId !== id) continue;
          if (!meta.roundEntryIds.has(score.entryId)) continue;
          if (score.matchupId && !meta.matchupIdsForRound.has(score.matchupId)) continue;
          votedCount += 1;
        }

        let status: VoteStatus;
        if (isCompetitor && meta.isShakeOrScored) {
          status = 'auto-max';
        } else if (!meta.isVotingOpen && !meta.isShakeOrScored) {
          status = 'not-open';
        } else if (expectedCount > 0 && votedCount >= expectedCount) {
          status = 'voted';
        } else if (votedCount > 0) {
          status = 'partial';
        } else {
          status = 'not-voted';
        }

        return {
          roundId: meta.round.id,
          roundIndex: meta.index,
          label: `Round ${meta.index + 1}`,
          status,
          votedCount,
          expectedCount,
          isCompetitor,
        };
      });

      const totalRounds = voteRounds.filter(
        (r) => r.status !== 'not-open' && !r.isCompetitor,
      ).length;
      const votedRoundCount = voteRounds.filter(
        (r) => r.status === 'voted' || r.status === 'auto-max',
      ).length;

      return {
        id,
        displayName,
        role,
        entries: participantEntries,
        competitorRoundIndexes,
        voteRounds,
        votedRoundCount,
        totalRounds,
      };
    };

    const list: ParticipantDetails[] = [];
    const seenNames = new Set<string>();

    for (const voter of voters) {
      seenNames.add(voter.displayName.toLowerCase());
      list.push(build(voter.id, voter.displayName, voter.role));
    }

    for (const entry of entries) {
      const name = entry.submittedBy;
      if (!name || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());
      list.push(build(`contestant-${name}`, name, 'competitor'));
    }

    return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [voters, entries, matchups, rounds, placementByEntryId, contestScores]);

  const filteredParticipants = useMemo(() => {
    if (filter === 'all') return participants;
    if (filter === 'no-entry') return participants.filter((p) => p.entries.length === 0);
    if (filter === 'unplaced')
      return participants.filter((p) =>
        p.entries.some((pe) => pe.placement === null),
      );
    return participants.filter((p) =>
      p.entries.some((pe) => pe.placement?.roundId === filter),
    );
  }, [participants, filter]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<Entry>) => {
    setActionError(null);
    const result = await updateContestant(contest.id, entryId, updates);
    if (!result) setActionError('Failed to update entry');
  };

  const handleRemoveEntry = async (entryId: string) => {
    setActionError(null);
    const ok = await removeContestant(contest.id, entryId);
    if (!ok) setActionError('Failed to remove entry');
  };

  const handleAddEntry = async (
    participant: ParticipantDetails,
    entryName: string,
  ): Promise<boolean> => {
    setActionError(null);
    const result = await addContestant(contest.id, {
      name: participant.displayName,
      entryName,
    });
    if (!result) {
      setActionError('Failed to add entry');
      return false;
    }
    return true;
  };

  return (
    <section className="admin-details-section">
      <header className="admin-participants-header">
        <h3>Participants ({participants.length})</h3>
        <label className="admin-participants-filter">
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="all">All participants</option>
            <option value="no-entry">No entry assigned</option>
            <option value="unplaced">Has unplaced entry</option>
            {rounds.map((round, index) => (
              <option key={round.id} value={round.id}>
                Placed in Round {index + 1}
              </option>
            ))}
          </select>
        </label>
      </header>

      {actionError && (
        <p className="admin-phase-controls__message--error">{actionError}</p>
      )}

      {filteredParticipants.length === 0 ? (
        <p className="admin-empty">No participants match this filter.</p>
      ) : (
        <ul className="admin-participants-list">
          {filteredParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              expanded={expandedIds.has(participant.id)}
              onToggle={() => toggleExpanded(participant.id)}
              onUpdateEntry={handleUpdateEntry}
              onRemoveEntry={handleRemoveEntry}
              onAddEntry={(entryName) => handleAddEntry(participant, entryName)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
