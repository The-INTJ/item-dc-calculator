'use client';

import type { Contest } from '../../contexts/contest/contestTypes';
import { useRoundState, phaseLabels } from '../../contexts/RoundStateContext';

interface ContestPhaseControlsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

export function ContestPhaseControls({ contest }: ContestPhaseControlsProps) {
  const { state, label } = useRoundState();
  const rounds = contest.rounds ?? [];
  const activeRoundIndex = rounds.findIndex((r) => r.id === contest.activeRoundId);
  const activeRound = activeRoundIndex !== -1 ? rounds[activeRoundIndex] : null;

  return (
    <section className="admin-details-section admin-phase-controls">
      <div className="admin-phase-controls__header">
        <div>
          <h3>Global contest state</h3>
          <p className="admin-detail-meta">
            Current: <strong>{label}</strong>
            {activeRound && (
              <> (from Round {activeRoundIndex + 1}: {phaseLabels[activeRound.state]})</>
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
