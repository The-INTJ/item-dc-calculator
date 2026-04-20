'use client';

import type { Contest } from '../../contexts/contest/contestTypes';

interface ContestCardProps {
  contest: Contest;
  onSelect: (contest: Contest) => void;
  isSelected: boolean;
}

export function ContestCard({ contest, onSelect, isSelected }: ContestCardProps) {
  const roundCount = contest.rounds?.length ?? 0;
  const entryCount = contest.entries?.length ?? 0;
  const voterCount = contest.voters?.length ?? 0;
  const voteCount = contest.entries?.reduce((sum, e) => sum + (e.voteCount ?? 0), 0) ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(contest)}
      className={`admin-contest-card ${isSelected ? 'admin-contest-card--selected' : ''}`}
    >
      <div className="admin-contest-card__header">
        <h3 className="admin-contest-card__name">{contest.name}</h3>
        <span className="admin-contest-card__phase">{roundCount} rounds</span>
      </div>
      <p className="admin-contest-card__location">{contest.location ?? 'No location set'}</p>
      <div className="admin-contest-card__stats">
        <span>{entryCount} entries</span>
        <span>{voterCount} voters</span>
        <span>{voteCount} votes</span>
      </div>
      {contest.defaultContest && (
        <span className="admin-contest-card__default">Current Default</span>
      )}
    </button>
  );
}
