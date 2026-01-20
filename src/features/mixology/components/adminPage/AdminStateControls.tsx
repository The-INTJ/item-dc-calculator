'use client';

import {
  useContestState,
  CONTEST_STATES,
  contestStateLabels,
  contestStateDescriptions,
  type ContestState,
} from '../../contexts/ContestStateContext';

export function AdminStateControls() {
  const { state, setState, label } = useContestState();

  const handleStateChange = (newState: ContestState) => {
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
        {CONTEST_STATES.map((stateOption) => {
          const isActive = stateOption === state;

          return (
            <button
              key={stateOption}
              type="button"
              className={`admin-phase-button ${isActive ? 'admin-phase-button--active' : ''}`}
              onClick={() => handleStateChange(stateOption)}
              aria-pressed={isActive}
            >
              <span className="admin-phase-button__label">{contestStateLabels[stateOption]}</span>
              <span className="admin-phase-button__desc">{contestStateDescriptions[stateOption]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
