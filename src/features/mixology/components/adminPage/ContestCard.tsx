'use client';

/**
 * ContestCard - Displays a single contest in the admin overview
 * Conforms to dev standards: < 80 lines, uses theme variables.
 */

import type { Contest } from '../../types';

interface ContestCardProps {
  contest: Contest;
  onSelect: (contest: Contest) => void;
  isSelected: boolean;
}

function getPhaseColor(phase: Contest['phase']): string {
  switch (phase) {
    case 'active':
      return 'var(--phase-active, #22c55e)';
    case 'judging':
      return 'var(--phase-judging, #f59e0b)';
    case 'closed':
      return 'var(--phase-closed, #94a3b8)';
    default:
      return 'var(--phase-setup, #3b82f6)';
  }
}

export function ContestCard({ contest, onSelect, isSelected }: ContestCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(contest)}
      className={`admin-contest-card ${isSelected ? 'admin-contest-card--selected' : ''}`}
    >
      <div className="admin-contest-card__header">
        <h3 className="admin-contest-card__name">{contest.name}</h3>
        <span
          className="admin-contest-card__phase"
          style={{ backgroundColor: getPhaseColor(contest.phase) }}
        >
          {contest.phase}
        </span>
      </div>
      <p className="admin-contest-card__location">{contest.location ?? 'No location set'}</p>
      <div className="admin-contest-card__stats">
        <span>{contest.drinks.length} drinks</span>
        <span>{contest.judges.length} judges</span>
        <span>{contest.scores.length} scores</span>
      </div>
      {contest.defaultContest && (
        <span className="admin-contest-card__default">Current Default</span>
      )}
    </button>
  );
}
