'use client';

/**
 * ContestDetails - Shows detailed info for a selected contest
 */

import type { Contest, Drink, Judge, ScoreEntry } from '@/src/mixology/backend';

interface ContestDetailsProps {
  contest: Contest;
}

function DrinkItem({ drink }: { drink: Drink }) {
  return (
    <li className="admin-detail-item">
      <strong>{drink.name}</strong>
      <span className="admin-detail-meta">by {drink.submittedBy} • {drink.round}</span>
    </li>
  );
}

function JudgeItem({ judge }: { judge: Judge }) {
  return (
    <li className="admin-detail-item">
      <strong>{judge.displayName}</strong>
      <span className={`admin-role-badge admin-role-badge--${judge.role}`}>{judge.role}</span>
    </li>
  );
}

function ScoreItem({ score, drinks, judges }: { score: ScoreEntry; drinks: Drink[]; judges: Judge[] }) {
  const drink = drinks.find((d) => d.id === score.drinkId);
  const judge = judges.find((j) => j.id === score.judgeId);
  const total = Object.values(score.breakdown).reduce((a, b) => a + b, 0);

  return (
    <li className="admin-detail-item admin-score-item">
      <div className="admin-score-item__header">
        <strong>{drink?.name ?? 'Unknown'}</strong>
        <span className="admin-detail-meta">by {judge?.displayName ?? 'Unknown'}</span>
      </div>
      <div className="admin-score-item__breakdown">
        <span>Aroma: {score.breakdown.aroma}</span>
        <span>Balance: {score.breakdown.balance}</span>
        <span>Presentation: {score.breakdown.presentation}</span>
        <span>Creativity: {score.breakdown.creativity}</span>
        <span>Overall: {score.breakdown.overall}</span>
        <strong>Total: {total}/50</strong>
      </div>
      {score.notes && <p className="admin-score-item__notes">{score.notes}</p>}
    </li>
  );
}

export function ContestDetails({ contest }: ContestDetailsProps) {
  return (
    <div className="admin-contest-details">
      <header className="admin-contest-details__header">
        <h2>{contest.name}</h2>
        <p className="admin-detail-meta">
          {contest.location ?? 'No location'} • {contest.bracketRound ?? 'No round'}
        </p>
      </header>

      <section className="admin-details-section">
        <h3>Drinks ({contest.drinks.length})</h3>
        {contest.drinks.length === 0 ? (
          <p className="admin-empty">No drinks registered yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.drinks.map((drink) => (
              <DrinkItem key={drink.id} drink={drink} />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Judges ({contest.judges.length})</h3>
        {contest.judges.length === 0 ? (
          <p className="admin-empty">No judges assigned yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.judges.map((judge) => (
              <JudgeItem key={judge.id} judge={judge} />
            ))}
          </ul>
        )}
      </section>

      <section className="admin-details-section">
        <h3>Scores ({contest.scores.length})</h3>
        {contest.scores.length === 0 ? (
          <p className="admin-empty">No scores submitted yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {contest.scores.map((score) => (
              <ScoreItem
                key={score.id}
                score={score}
                drinks={contest.drinks}
                judges={contest.judges}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
