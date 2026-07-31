'use client';

/**
 * RoundStateControls - The admin controls for one round's lifecycle: force
 * open / force close / clear override, plus seeding and its error readout.
 */

import type { ContestRound, Matchup } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';

interface RoundStateControlsProps {
  contestId: string;
  round: ContestRound;
  roundMatchups: Matchup[];
  canSeed: boolean;
  seedError: string | undefined;
  onRequestSeed: () => void;
  onRequestForceClose: () => void;
}

export function RoundStateControls({
  contestId,
  round,
  roundMatchups,
  canSeed,
  seedError,
  onRequestSeed,
  onRequestForceClose,
}: RoundStateControlsProps) {
  const { setRoundOverride } = useContestStore();

  return (
    <div className="admin-round-state-controls">
      <div className="admin-round-actions">
        <div className="admin-round-action-group" role="group" aria-label="Round state">
          <span className="admin-round-action-group__label">Round state</span>
          {round.adminOverride == null ? (
            <>
              <button
                type="button"
                className="button-secondary"
                onClick={() => void setRoundOverride(contestId, round.id, 'active')}
              >
                Force open
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={onRequestForceClose}
              >
                Force close
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button-secondary"
              onClick={() => void setRoundOverride(contestId, round.id, null)}
            >
              Clear override ({round.adminOverride})
            </button>
          )}
        </div>
        {canSeed && (
          <div className="admin-round-action-group" role="group" aria-label="Seeding">
            <span className="admin-round-action-group__label">Seeding</span>
            <button
              type="button"
              className="button-secondary"
              onClick={onRequestSeed}
            >
              {roundMatchups.length > 0 ? 'Reseed round' : 'Seed round'}
            </button>
          </div>
        )}
      </div>
      {seedError && (
        <p className="admin-round-error" role="alert">
          {seedError}
        </p>
      )}
    </div>
  );
}
