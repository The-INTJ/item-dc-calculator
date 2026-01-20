'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contest } from '../../types';
import { useContestMutations } from '../../hooks';

const contestUpdatedEvent = 'mixology:contest-updated';

type Status = 'idle' | 'saving' | 'success' | 'error';

interface ContestPhaseControlsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

const phaseLabels: Record<Contest['phase'], string> = {
  setup: 'Setup',
  active: 'Active',
  judging: 'Judging',
  closed: 'Closed',
};

const phaseDescriptions: Record<Contest['phase'], string> = {
  setup: 'Pre-contest setup and roster checks.',
  active: 'Mixologists are mixing and judges are watching.',
  judging: 'Votes are open and scores are collected.',
  closed: 'Scores locked; round recap shown.',
};

export function ContestPhaseControls({ contest, onContestUpdated }: ContestPhaseControlsProps) {
  const { updateContest, loading } = useContestMutations();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const phaseOptions = useMemo(
    () =>
      (Object.keys(phaseLabels) as Array<Contest['phase']>).map((phase) => ({
        value: phase,
        label: phaseLabels[phase],
        description: phaseDescriptions[phase],
      })),
    []
  );

  useEffect(() => {
    setStatus('idle');
    setMessage(null);
  }, [contest.id]);

  const handlePhaseChange = async (phase: Contest['phase']) => {
    if (phase === contest.phase || loading) {
      return;
    }

    setStatus('saving');
    setMessage(null);

    const result = await updateContest(contest.id, { phase });

    if (!result.success || !result.data) {
      setStatus('error');
      setMessage(result.error ?? 'Failed to update contest state.');
      return;
    }

    onContestUpdated(result.data);
    setStatus('success');
    setMessage(`State updated to ${phaseLabels[phase]}.`);
    window.dispatchEvent(new Event(contestUpdatedEvent));
  };

  return (
    <section className="admin-details-section admin-phase-controls">
      <div className="admin-phase-controls__header">
        <div>
          <h3>Contest state</h3>
          <p className="admin-detail-meta">Current: {phaseLabels[contest.phase]}</p>
        </div>
        {message ? (
          <p className={`admin-phase-controls__message admin-phase-controls__message--${status}`}>
            {message}
          </p>
        ) : null}
      </div>

      <div className="admin-phase-controls__grid">
        {phaseOptions.map((option) => {
          const isActive = option.value === contest.phase;

          return (
            <button
              key={option.value}
              type="button"
              className={`admin-phase-button ${isActive ? 'admin-phase-button--active' : ''}`}
              onClick={() => handlePhaseChange(option.value)}
              aria-pressed={isActive}
              disabled={loading}
            >
              <span className="admin-phase-button__label">{option.label}</span>
              <span className="admin-phase-button__desc">{option.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
