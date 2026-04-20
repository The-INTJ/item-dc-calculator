'use client';

import { useMemo, useState } from 'react';
import type { Contest, Entry, Matchup } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';

interface AdminContestantsProps {
  contest: Contest;
  matchups: Matchup[];
}

function ContestantRow({
  entry,
  placedLabel,
  onUpdate,
  onRemove,
}: {
  entry: Entry;
  placedLabel: string;
  onUpdate: (updates: Partial<Entry>) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpdate = async (updates: Partial<Entry>) => {
    setUpdating(true);
    await onUpdate(updates);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove();
  };

  return (
    <li className="admin-detail-item admin-contestant-item">
      <strong>{entry.submittedBy}</strong>
      <input
        className="admin-contestant-input"
        value={entry.name ?? ''}
        onChange={(event) => handleUpdate({ name: event.target.value })}
        placeholder="Entry name"
        disabled={updating || removing}
      />
      <span className="admin-detail-meta">{placedLabel}</span>
      <button
        type="button"
        className="button-secondary"
        onClick={handleRemove}
        disabled={updating || removing}
      >
        {removing ? 'Removing...' : 'Remove'}
      </button>
    </li>
  );
}

type Filter = 'all' | 'unplaced' | string;

export function AdminContestants({ contest, matchups }: AdminContestantsProps) {
  const { addContestant, updateContestant, removeContestant } = useContestStore();
  const [selectedVoterId, setSelectedVoterId] = useState('');
  const [entryName, setEntryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const rounds = contest.rounds ?? [];

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

  const entries = contest.entries ?? [];
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    if (filter === 'unplaced') return entries.filter((e) => !placementByEntryId.has(e.id));
    return entries.filter((e) => placementByEntryId.get(e.id)?.roundId === filter);
  }, [entries, filter, placementByEntryId]);

  const placedLabel = (entryId: string) => {
    const placement = placementByEntryId.get(entryId);
    if (!placement) return 'Unplaced';
    return `Round ${placement.roundIndex + 1}`;
  };

  const assignedNames = new Set(entries.map((e) => e.submittedBy?.toLowerCase()));
  const availableVoters = (contest.voters ?? []).filter(
    (v) => !assignedNames.has(v.displayName.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!selectedVoterId) return;

    const voter = contest.voters?.find((v) => v.id === selectedVoterId);
    if (!voter) return;

    setLoading(true);
    setError(null);

    const result = await addContestant(contest.id, {
      name: voter.displayName,
      entryName: entryName.trim(),
    });

    if (result) {
      setSelectedVoterId('');
      setEntryName('');
    } else {
      setError('Failed to assign contestant');
    }

    setLoading(false);
  };

  return (
    <section className="admin-details-section">
      <h3>Contestants & Entries</h3>

      <div className="admin-contestant-add">
        <select
          className="admin-contestant-select"
          value={selectedVoterId}
          onChange={(event) => setSelectedVoterId(event.target.value)}
          disabled={loading}
        >
          <option value="">Assign participant...</option>
          {availableVoters.map((voter) => (
            <option key={voter.id} value={voter.id}>
              {voter.displayName}
            </option>
          ))}
        </select>
        <input
          className="admin-contestant-input"
          placeholder="Entry name (optional)"
          value={entryName}
          onChange={(event) => setEntryName(event.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          className="button-secondary"
          onClick={handleAdd}
          disabled={loading || !selectedVoterId}
        >
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

      <div className="admin-contestant-filters">
        <label>
          Filter:&nbsp;
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">All contestants</option>
            <option value="unplaced">Unplaced</option>
            {rounds.map((r, i) => (
              <option key={r.id} value={r.id}>
                Placed in Round {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="admin-empty">No contestants match this filter.</p>
      ) : (
        <ul className="admin-detail-list">
          {filteredEntries.map((entry) => (
            <ContestantRow
              key={entry.id}
              entry={entry}
              placedLabel={placedLabel(entry.id)}
              onUpdate={async (updates) => {
                await updateContestant(contest.id, entry.id, updates);
              }}
              onRemove={async () => {
                await removeContestant(contest.id, entry.id);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
