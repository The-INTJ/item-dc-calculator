'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contest, Entry } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getRoundLabel } from '../../lib/helpers/contestGetters';

interface AdminContestantsProps {
  contest: Contest;
}

function ContestantRow({
  contest,
  entry,
  onUpdate,
  onRemove,
}: {
  contest: Contest;
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const rounds = contest.rounds ?? [];
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
      <input
        className="admin-contestant-input"
        value={entry.submittedBy}
        onChange={(event) => handleUpdate({ submittedBy: event.target.value })}
        placeholder="Contestant name"
        disabled={updating || removing}
      />
      <input
        className="admin-contestant-input"
        value={entry.name ?? ''}
        onChange={(event) => handleUpdate({ name: event.target.value })}
        placeholder="Entry name"
        disabled={updating || removing}
      />
      <select
        className="admin-contestant-select"
        value={entry.round}
        onChange={(event) => handleUpdate({ round: event.target.value })}
        disabled={updating || removing}
      >
        {rounds.length === 0 ? <option value="">No rounds</option> : null}
        {rounds.map((round, index) => (
          <option key={round.id} value={round.id}>
            Round {index + 1}
          </option>
        ))}
      </select>
      <button type="button" className="button-secondary" onClick={handleRemove} disabled={updating || removing}>
        {removing ? 'Removing...' : 'Remove'}
      </button>
    </li>
  );
}

export function AdminContestants({ contest }: AdminContestantsProps) {
  const { addContestant, updateContestant, removeContestant } = useContestStore();
  const [contestantName, setContestantName] = useState('');
  const [entryName, setEntryName] = useState('');
  const [roundId, setRoundId] = useState(contest.futureRoundId ?? contest.activeRoundId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rounds = contest.rounds ?? [];
  const roundOptions = useMemo(() => rounds.slice(), [rounds]);

  useEffect(() => {
    if (!roundId && (contest.futureRoundId || contest.activeRoundId)) {
      setRoundId(contest.futureRoundId ?? contest.activeRoundId ?? '');
    }
  }, [contest.futureRoundId, contest.activeRoundId, roundId]);

  const handleAdd = async () => {
    if (!contestantName.trim() || !roundId) return;

    setLoading(true);
    setError(null);

    const result = await addContestant(contest.id, {
      name: contestantName.trim(),
      entryName: entryName.trim(),
      roundId,
    });

    if (result) {
      setContestantName('');
      setEntryName('');
    } else {
      setError('Failed to add contestant');
    }

    setLoading(false);
  };

  return (
    <section className="admin-details-section">
      <h3>Contestants & Entries</h3>
      <div className="admin-contestant-add">
        <input
          className="admin-contestant-input"
          placeholder="Contestant name"
          value={contestantName}
          onChange={(event) => setContestantName(event.target.value)}
          disabled={loading}
        />
        <input
          className="admin-contestant-input"
          placeholder="Entry name"
          value={entryName}
          onChange={(event) => setEntryName(event.target.value)}
          disabled={loading}
        />
        <select
          className="admin-contestant-select"
          value={roundId}
          onChange={(event) => setRoundId(event.target.value)}
          disabled={loading}
        >
          <option value="">Select round</option>
          {roundOptions.map((round, index) => (
            <option key={round.id} value={round.id}>
              Round {index + 1}
            </option>
          ))}
        </select>
        <button type="button" className="button-secondary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add contestant'}
        </button>
      </div>

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

      {contest.entries.length === 0 ? (
        <p className="admin-empty">No contestants added yet.</p>
      ) : (
        <ul className="admin-detail-list">
          {contest.entries.map((entry) => (
            <ContestantRow
              key={entry.id}
              contest={contest}
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

      <p className="admin-detail-meta">Active round: {getRoundLabel(contest, contest.activeRoundId)}</p>
    </section>
  );
}
