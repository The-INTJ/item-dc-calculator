'use client';

import type { ContestPhase } from '../../contexts/contest/contestTypes';
import {
  useRoundState,
  PHASE_VALUES,
  phaseLabels,
  phaseDescriptions,
} from '../../contexts/RoundStateContext';

export function AdminStateControls() {
  const { state, setState, label } = useRoundState();

  const handleStateChange = (newState: ContestPhase) => {
    if (newState !== state) {
      setState(newState);
    }
  };

  return (
    <section className="admin-details-section admin-phase-controls">
      <div className="admin-phase-controls__header">
        <div>
          <h3>Contest state</h3>
          <p className="admin-detail-meta">Current: {label}</p>
        </div>
      </div>

      <div className="admin-phase-controls__grid">
        {PHASE_VALUES.map((stateOption) => {
          const isActive = stateOption === state;

          return (
            <button
              key={stateOption}
              type="button"
              className={`admin-phase-button ${isActive ? 'admin-phase-button--active' : ''}`}
              onClick={() => handleStateChange(stateOption)}
              aria-pressed={isActive}
            >
              <span className="admin-phase-button__label">{phaseLabels[stateOption]}</span>
              <span className="admin-phase-button__desc">{phaseDescriptions[stateOption]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
