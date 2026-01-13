'use client';

/**
 * ContestCard - Displays a single contest in the admin overview
 * Conforms to dev standards: < 80 lines.
 */

import type { Contest } from '@/src/mixology/backend';

interface ContestCardProps {
  contest: Contest;
  onSelect: (contest: Contest) => void;
  isSelected: boolean;
}

function getPhaseClassName(phase: Contest['phase']): string {
  switch (phase) {
    case 'active':
      return 'admin-contest-card__phase--active';
    case 'judging':
      return 'admin-contest-card__phase--judging';
    case 'closed':
      return 'admin-contest-card__phase--closed';
    default:
      return 'admin-contest-card__phase--setup';
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
        <span className={`admin-contest-card__phase ${getPhaseClassName(contest.phase)}`}>
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
