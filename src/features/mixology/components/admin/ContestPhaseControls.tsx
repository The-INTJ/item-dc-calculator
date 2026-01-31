'use client';

import type { Contest } from '../../types';
import { useContestState, contestStateLabels } from '../../contexts/ContestStateContext';
import { getRoundById } from '../../lib/contestHelpers';

interface ContestPhaseControlsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

export function ContestPhaseControls({ contest }: ContestPhaseControlsProps) {
  const { state, label } = useContestState();
  const activeRound = getRoundById(contest, contest.activeRoundId);

  return (
    <section className="admin-details-section admin-phase-controls">
      <div className="admin-phase-controls__header">
        <div>
          <h3>Global contest state</h3>
          <p className="admin-detail-meta">
            Current: <strong>{label}</strong>
            {activeRound && (
              <> (from {activeRound.name}: {contestStateLabels[activeRound.state]})</>
            )}
          </p>
        </div>
      </div>
      <p className="admin-phase-controls__info">
        The global state is determined by the active round&apos;s state. Use the Rounds section below to
        change which round is active and set its state.
      </p>
    </section>
  );
}
