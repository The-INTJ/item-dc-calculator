'use client';

import { useState } from 'react';
import { contestApi } from '@/contest/lib/api/contestApi';

interface ContestantCtaProps {
  contestId: string;
  userDisplayName: string;
  contestantLabel: string;
  entryLabel: string;
}

export function ContestantCta({
  contestId,
  userDisplayName,
  contestantLabel,
  entryLabel,
}: ContestantCtaProps) {
  const [showEntryInput, setShowEntryInput] = useState(false);
  const [entryName, setEntryName] = useState('');
  const [registering, setRegistering] = useState(false);

  const handleClick = async () => {
    if (!showEntryInput) {
      setShowEntryInput(true);
      return;
    }
    const trimmed = entryName.trim();
    if (!trimmed) return;
    setRegistering(true);
    await contestApi.registerAsContestant(contestId, userDisplayName, trimmed);
    setShowEntryInput(false);
    setEntryName('');
    setRegistering(false);
  };

  const disabled = registering || (showEntryInput && !entryName.trim());

  return (
    <section className="contestant-cta" aria-label={`Register as a ${contestantLabel}`}>
      {!showEntryInput && (
        <p className="contestant-cta__prompt">Ready to compete? Sign up with your {entryLabel.toLowerCase()}.</p>
      )}
      {showEntryInput && (
        <input
          type="text"
          className="contestant-cta__input"
          placeholder={`${entryLabel} name (e.g. "Smoky Paloma")`}
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleClick();
          }}
          autoFocus
          aria-label={`${entryLabel} name`}
        />
      )}
      <button
        type="button"
        className="contestant-cta__button"
        onClick={handleClick}
        disabled={disabled}
      >
        {registering
          ? 'Registering...'
          : showEntryInput
            ? `Register as ${contestantLabel}`
            : `Be a ${contestantLabel}`}
      </button>
    </section>
  );
}
