'use client';

import type { Contest } from '../../contexts/contest/contestTypes';
import { getRoundById } from '../../lib/domain/contestGetters';
import { phaseLabels } from '../../lib/domain/contestPhases';

interface ContestPhaseControlsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

export function ContestPhaseControls({ contest }: ContestPhaseControlsProps) {
  const rounds = contest.rounds ?? [];
  const activeRoundIndex = rounds.findIndex((r) => r.id === contest.activeRoundId);
  const activeRound = getRoundById(contest, contest.activeRoundId);
  const currentPhase = activeRound?.state ?? contest.phase ?? 'set';
  const label = phaseLabels[currentPhase];

  return (
    <section className="admin-details-section admin-phase-controls">
      <div className="admin-phase-controls__header">
        <div>
          <h3>Global contest state</h3>
          <p className="admin-detail-meta">
            Current: <strong>{label}</strong>
            {activeRound && (
              <> (from Round {activeRoundIndex + 1}: {phaseLabels[activeRound.state ?? 'set']})</>
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
