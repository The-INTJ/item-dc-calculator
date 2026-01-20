'use client';

import { useMemo, useState } from 'react';
import type { Contest } from '../../types';
import { useAdminContestData } from '../../contexts/AdminContestContext';
import { getRoundById, getRoundLabel, getRoundStatus } from '../../lib/contestHelpers';

interface AdminContestRoundsProps {
  contest: Contest;
}

export function AdminContestRounds({ contest }: AdminContestRoundsProps) {
  const { addRound, removeRound, setFutureRound, shakeRound } = useAdminContestData();
  const [roundName, setRoundName] = useState('');
  const [roundNumber, setRoundNumber] = useState('');

  const rounds = contest.rounds ?? [];
  const activeRound = getRoundById(contest, contest.activeRoundId);
  const futureRoundId = contest.futureRoundId ?? '';

  const canShake = Boolean(futureRoundId && futureRoundId !== contest.activeRoundId);
  const orderedRounds = useMemo(() => rounds.slice(), [rounds]);

  const handleAddRound = () => {
    if (!roundName.trim()) return;
    addRound(contest.id, {
      name: roundName.trim(),
      number: roundNumber ? Number(roundNumber) : null,
    });
    setRoundName('');
    setRoundNumber('');
  };

  return (
    <section className="admin-details-section">
      <div className="admin-rounds-header">
        <div>
          <h3>Rounds</h3>
          <p className="admin-detail-meta">Active: {activeRound?.name ?? 'None'}</p>
        </div>
        <button type="button" className="button-primary" onClick={() => shakeRound(contest.id)} disabled={!canShake}>
          Shake → Activate future
        </button>
      </div>

      <div className="admin-rounds-controls">
        <label className="admin-rounds-field">
          <span>Future round</span>
          <select
            className="admin-rounds-select"
            value={futureRoundId}
            onChange={(event) => setFutureRound(contest.id, event.target.value)}
          >
            <option value="">Select a round</option>
            {orderedRounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </label>
        <p className="admin-detail-meta">
          Next up: {futureRoundId ? getRoundLabel(contest, futureRoundId) : 'Not set'}
        </p>
      </div>

      <ul className="admin-detail-list">
        {orderedRounds.map((round) => {
          const status = getRoundStatus(contest, round.id);
          return (
            <li key={round.id} className="admin-detail-item admin-round-item">
              <div>
                <strong>{round.name}</strong>
                <span className="admin-detail-meta">{round.number ? `Round ${round.number}` : 'Unnumbered'}</span>
              </div>
              <span className={`admin-round-badge admin-round-badge--${status}`}>{status}</span>
              <button
                type="button"
                className="button-secondary"
                onClick={() => removeRound(contest.id, round.id)}
                disabled={round.id === contest.activeRoundId}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="admin-rounds-add">
        <input
          className="admin-rounds-input"
          placeholder="Round name"
          value={roundName}
          onChange={(event) => setRoundName(event.target.value)}
        />
        <input
          className="admin-rounds-input"
          placeholder="Number"
          value={roundNumber}
          onChange={(event) => setRoundNumber(event.target.value)}
        />
        <button type="button" className="button-secondary" onClick={handleAddRound}>
          Add round
        </button>
      </div>
    </section>
  );
}
