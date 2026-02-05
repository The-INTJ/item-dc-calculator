'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contest, Entry } from '../../lib/globals';
import { useContestData } from '../../contexts/contest';
import { getRoundLabel } from '../../lib/helpers/contestGetters';

interface AdminMixologistsProps {
  contest: Contest;
}

function MixologistRow({
  contest,
  drink,
  onUpdate,
  onRemove,
}: {
  contest: Contest;
  drink: Entry;
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
    // No need to set removing false as component unmounts
  };

  return (
    <li className="admin-detail-item admin-mixologist-item">
      <input
        className="admin-mixologist-input"
        value={drink.submittedBy}
        onChange={(event) => handleUpdate({ submittedBy: event.target.value })}
        placeholder="Mixologist name"
        disabled={updating || removing}
      />
      <input
        className="admin-mixologist-input"
        value={drink.name ?? ''}
        onChange={(event) => handleUpdate({ name: event.target.value })}
        placeholder="Drink name"
        disabled={updating || removing}
      />
      <select
        className="admin-mixologist-select"
        value={drink.round}
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

export function AdminMixologists({ contest }: AdminMixologistsProps) {
  const { addMixologist, updateMixologist, removeMixologist } = useContestData();
  const [mixologistName, setMixologistName] = useState('');
  const [drinkName, setDrinkName] = useState('');
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
    if (!mixologistName.trim() || !roundId) return;
    
    setLoading(true);
    setError(null);
    
    const result = await addMixologist(contest.id, { 
      name: mixologistName.trim(), 
      drinkName: drinkName.trim(), 
      roundId 
    });
    
    if (result) {
      setMixologistName('');
      setDrinkName('');
    } else {
      setError('Failed to add mixologist');
    }
    
    setLoading(false);
  };

  return (
    <section className="admin-details-section">
      <h3>Mixologists & Drinks</h3>
      <div className="admin-mixologist-add">
        <input
          className="admin-mixologist-input"
          placeholder="Mixologist name"
          value={mixologistName}
          onChange={(event) => setMixologistName(event.target.value)}
          disabled={loading}
        />
        <input
          className="admin-mixologist-input"
          placeholder="Drink name"
          value={drinkName}
          onChange={(event) => setDrinkName(event.target.value)}
          disabled={loading}
        />
        <select
          className="admin-mixologist-select"
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
        <button 
          type="button" 
          className="button-secondary" 
          onClick={handleAdd}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add mixologist'}
        </button>
      </div>

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

      {contest?.entries?.length === 0 ? (
        <p className="admin-empty">No mixologists added yet.</p>
      ) : (
        <ul className="admin-detail-list">
          {contest?.entries?.map((drink) => (
            <MixologistRow
              key={drink.id}
              contest={contest}
              drink={drink}
              onUpdate={async (updates) => {
                await updateMixologist(contest.id, drink.id, updates);
              }}
              onRemove={async () => {
                await removeMixologist(contest.id, drink.id);
              }}
            />
          ))}
        </ul>
      )}

      <p className="admin-detail-meta">Active round: {getRoundLabel(contest, contest.activeRoundId)}</p>
    </section>
  );
}
