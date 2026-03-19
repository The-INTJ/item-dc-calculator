'use client';

import type { Contest, ContestConfig, ContestPhase } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getEntriesForRound } from '../../lib/domain/contestGetters';
import {
  PHASE_VALUES,
  phaseLabels,
} from '../../lib/domain/contestPhases';

interface AdminContestRoundsProps {
  contest: Contest;
  config: ContestConfig;
  selectedRoundId: string | null;
  onSelectRound: (roundId: string) => void;
}

export function AdminContestRounds({ contest, config, selectedRoundId, onSelectRound }: AdminContestRoundsProps) {
  const { addRound, removeRound, setActiveRound, setRoundState } = useContestStore();

  const rounds = contest.rounds ?? [];
  const maxScore = config.attributes.reduce((sum, a) => sum + (a.max ?? 10), 0);

  const handleAddRound = () => {
    void addRound(contest.id);
  };

  const handleStateChange = (roundId: string, newState: ContestPhase) => {
    void setRoundState(contest.id, roundId, newState);
  };

  return (
    <section className="admin-details-section">
      <div className="admin-rounds-header">
        <h3>Rounds</h3>
      </div>

      <ul className="admin-detail-list admin-rounds-list">
        {rounds.map((round, index) => {
          const isActive = round.id === contest.activeRoundId;
          const isSelected = round.id === selectedRoundId;
          const entries = getEntriesForRound(contest, round.id);

          return (
            <li
              key={round.id}
              className={[
                'admin-round-item',
                isActive ? 'admin-round-item--active' : '',
                isSelected ? 'admin-round-item--selected' : '',
              ].join(' ')}
            >
              <button
                type="button"
                className="admin-round-item__header"
                onClick={() => onSelectRound(round.id)}
              >
                <div className="admin-round-item__info">
                  <strong>Round {index + 1}</strong>
                  <span className="admin-detail-meta">
                    {isActive ? 'Active' : ''}
                  </span>
                </div>
                <span className={`admin-round-badge admin-round-badge--${round.state}`}>
                  {phaseLabels[round.state]}
                </span>
              </button>

              {isSelected && (
                <div className="admin-round-state-controls">
                  <div className="admin-round-actions">
                    {!isActive && (
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => void setActiveRound(contest.id, round.id)}
                      >
                        Make active
                      </button>
                    )}
                  </div>
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inline entries for this round */}
              {isSelected && entries.length > 0 && (
                <div className="admin-round-entries">
                  {entries.map((entry) => {
                    const hasVotes = (entry.voteCount ?? 0) > 0;
                    const avgScore = hasVotes
                      ? Math.round((entry.sumScore ?? 0) / entry.voteCount!)
                      : null;

                    return (
                      <div key={entry.id} className="admin-round-entry">
                        <div className="admin-round-entry__contestant">
                          <strong>{entry.submittedBy}</strong>
                          <span className="admin-round-entry__name">
                            {entry.name || 'Not submitted!'}
                          </span>
                        </div>
                        <span className="admin-round-entry__score">
                          {avgScore !== null ? `${avgScore}/${maxScore}` : 'No votes'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {isSelected && entries.length === 0 && (
                <p className="admin-detail-meta" style={{ padding: '0.5rem' }}>
                  No entries in this round.
                </p>
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
