'use client';

import { useState } from 'react';
import type { Contest, Entry } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getEntriesForRound, getRoundLabel } from '../../lib/domain/contestGetters';

interface AdminContestantsProps {
  contest: Contest;
  selectedRoundId: string | null;
}

function ContestantRow({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: Entry;
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
      <button type="button" className="button-secondary" onClick={handleRemove} disabled={updating || removing}>
        {removing ? 'Removing...' : 'Remove'}
      </button>
    </li>
  );
}

export function AdminContestants({ contest, selectedRoundId }: AdminContestantsProps) {
  const { addContestant, updateContestant, removeContestant } = useContestStore();
  const [selectedVoterId, setSelectedVoterId] = useState('');
  const [entryName, setEntryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roundId = selectedRoundId ?? contest.activeRoundId ?? '';
  const roundLabel = getRoundLabel(contest, roundId);
  const roundEntries = roundId ? getEntriesForRound(contest, roundId) : [];

  // Voters already assigned to this round (by matching submittedBy to voter displayName)
  const assignedNames = new Set(roundEntries.map((e) => e.submittedBy?.toLowerCase()));
  const availableVoters = (contest.voters ?? []).filter(
    (v) => !assignedNames.has(v.displayName.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!selectedVoterId || !roundId) return;

    const voter = contest.voters?.find((v) => v.id === selectedVoterId);
    if (!voter) return;

    setLoading(true);
    setError(null);

    const result = await addContestant(contest.id, {
      name: voter.displayName,
      entryName: entryName.trim(),
      roundId,
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
      <p className="admin-detail-meta" style={{ marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
        {roundLabel}
      </p>

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
        <button type="button" className="button-secondary" onClick={handleAdd} disabled={loading || !selectedVoterId}>
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

      {roundEntries.length === 0 ? (
        <p className="admin-empty">No contestants in this round.</p>
      ) : (
        <ul className="admin-detail-list">
          {roundEntries.map((entry) => (
            <ContestantRow
              key={entry.id}
              entry={entry}
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
