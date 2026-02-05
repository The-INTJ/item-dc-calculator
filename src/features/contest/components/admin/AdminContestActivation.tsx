'use client';

import type { Contest } from '../../contexts/contest/contestTypes';

interface AdminContestActivationProps {
  contest: Contest;
  isActive: boolean;
  onSetActive: () => void;
}

export function AdminContestActivation({ contest, isActive, onSetActive }: AdminContestActivationProps) {
  return (
    <section className="admin-details-section admin-contest-activation">
      <div>
        <h3>Active contest</h3>
        <p className="admin-detail-meta">
          {isActive ? `${contest.name} is the current live contest.` : 'Select this contest to go live.'}
        </p>
      </div>
      <button
        type="button"
        className="button-primary"
        onClick={onSetActive}
        disabled={isActive}
      >
        {isActive ? 'Live contest' : 'Set as active'}
      </button>
    </section>
  );
}
