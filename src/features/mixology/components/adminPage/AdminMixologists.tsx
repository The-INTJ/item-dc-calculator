'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contest, Drink } from '../../types';
import { useAdminContestData } from '../../contexts/AdminContestContext';
import { getRoundLabel } from '../../lib/contestHelpers';

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
  drink: Drink;
  onUpdate: (updates: Partial<Drink>) => void;
  onRemove: () => void;
}) {
  const rounds = contest.rounds ?? [];

  return (
    <li className="admin-detail-item admin-mixologist-item">
      <input
        className="admin-mixologist-input"
        value={drink.submittedBy}
        onChange={(event) => onUpdate({ submittedBy: event.target.value })}
        placeholder="Mixologist name"
      />
      <input
        className="admin-mixologist-input"
        value={drink.name ?? ''}
        onChange={(event) => onUpdate({ name: event.target.value })}
        placeholder="Drink name"
      />
      <select
        className="admin-mixologist-select"
        value={drink.round}
        onChange={(event) => onUpdate({ round: event.target.value })}
      >
        {rounds.length === 0 ? <option value="">No rounds</option> : null}
        {rounds.map((round) => (
          <option key={round.id} value={round.id}>
            {round.name}
          </option>
        ))}
      </select>
      <button type="button" className="button-secondary" onClick={onRemove}>
        Remove
      </button>
    </li>
  );
}

export function AdminMixologists({ contest }: AdminMixologistsProps) {
  const { addMixologist, updateMixologist, removeMixologist } = useAdminContestData();
  const [mixologistName, setMixologistName] = useState('');
  const [drinkName, setDrinkName] = useState('');
  const [roundId, setRoundId] = useState(contest.futureRoundId ?? contest.activeRoundId ?? '');

  const rounds = contest.rounds ?? [];
  const roundOptions = useMemo(() => rounds.slice(), [rounds]);

  useEffect(() => {
    if (!roundId && (contest.futureRoundId || contest.activeRoundId)) {
      setRoundId(contest.futureRoundId ?? contest.activeRoundId ?? '');
    }
  }, [contest.futureRoundId, contest.activeRoundId, roundId]);

  const handleAdd = () => {
    if (!mixologistName.trim() || !roundId) return;
    addMixologist(contest.id, { name: mixologistName.trim(), drinkName: drinkName.trim(), roundId });
    setMixologistName('');
    setDrinkName('');
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
        />
        <input
          className="admin-mixologist-input"
          placeholder="Drink name"
          value={drinkName}
          onChange={(event) => setDrinkName(event.target.value)}
        />
        <select
          className="admin-mixologist-select"
          value={roundId}
          onChange={(event) => setRoundId(event.target.value)}
        >
          <option value="">Select round</option>
          {roundOptions.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name}
            </option>
          ))}
        </select>
        <button type="button" className="button-secondary" onClick={handleAdd}>
          Add mixologist
        </button>
      </div>

      {contest.drinks.length === 0 ? (
        <p className="admin-empty">No mixologists added yet.</p>
      ) : (
        <ul className="admin-detail-list">
          {contest.drinks.map((drink) => (
            <MixologistRow
              key={drink.id}
              contest={contest}
              drink={drink}
              onUpdate={(updates) => updateMixologist(contest.id, drink.id, updates)}
              onRemove={() => removeMixologist(contest.id, drink.id)}
            />
          ))}
        </ul>
      )}

      <p className="admin-detail-meta">Active round: {getRoundLabel(contest, contest.activeRoundId)}</p>
    </section>
  );
}
