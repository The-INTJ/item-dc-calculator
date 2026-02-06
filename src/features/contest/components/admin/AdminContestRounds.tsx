'use client';

import type { Contest, ContestPhase } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getRoundById } from '../../lib/helpers/contestGetters';
import {
  PHASE_VALUES,
  phaseLabels,
  phaseDescriptions,
} from '../../contexts/RoundStateContext';

interface AdminContestRoundsProps {
  contest: Contest;
}

export function AdminContestRounds({ contest }: AdminContestRoundsProps) {
  const { addRound, removeRound, setActiveRound, setRoundState } = useContestStore();

  const rounds = contest.rounds ?? [];
  const activeRound = getRoundById(contest, contest.activeRoundId);

  const handleAddRound = () => {
    void addRound(contest.id);
  };

  const handleRoundClick = (roundId: string) => {
    // Clicking a round makes it active and syncs global state to that round's state
    void setActiveRound(contest.id, roundId);
  };

  const handleStateChange = (roundId: string, newState: ContestPhase) => {
    // Setting a round's state updates that round; if it's the active round, global state updates too
    void setRoundState(contest.id, roundId, newState);
  };

  return (
    <section className="admin-details-section">
      <div className="admin-rounds-header">
        <div>
          <h3>Rounds</h3>
          <p className="admin-detail-meta">
            Click a round to make it active. The active round&apos;s state becomes the global contest state.
          </p>
        </div>
      </div>

      <ul className="admin-detail-list admin-rounds-list">
        {rounds.map((round, index) => {
          const isActive = round.id === contest.activeRoundId;
          return (
            <li
              key={round.id}
              className={`admin-round-item ${isActive ? 'admin-round-item--active' : ''}`}
            >
              <button
                type="button"
                className="admin-round-item__header"
                onClick={() => handleRoundClick(round.id)}
              >
                <div className="admin-round-item__info">
                  <strong>Round {index + 1}</strong>
                  <span className="admin-detail-meta">
                    {isActive && 'Active'}
                  </span>
                </div>
                <span className={`admin-round-badge admin-round-badge--${round.state}`}>
                  {phaseLabels[round.state]}
                </span>
              </button>

              {isActive && (
                <div className="admin-round-state-controls">
                  <p className="admin-detail-meta">Set state for this active round:</p>
                  <div className="admin-phase-controls__grid admin-phase-controls__grid--compact">
                    {PHASE_VALUES.map((stateOption) => {
                      const isCurrentState = stateOption === round.state;
                      return (
                        <button
                          key={stateOption}
                          type="button"
                          className={`admin-phase-button admin-phase-button--compact ${isCurrentState ? 'admin-phase-button--active' : ''}`}
                          onClick={() => handleStateChange(round.id, stateOption)}
                          aria-pressed={isCurrentState}
                        >
                          <span className="admin-phase-button__label">
                            {phaseLabels[stateOption]}
                          </span>
                          <span className="admin-phase-button__desc">
                            {phaseDescriptions[stateOption]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="button-secondary admin-round-item__remove"
                onClick={() => void removeRound(contest.id, round.id)}
                disabled={isActive}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="admin-rounds-add">
        <button type="button" className="button-secondary" onClick={handleAddRound}>
          Add round
        </button>
      </div>
    </section>
  );
}
