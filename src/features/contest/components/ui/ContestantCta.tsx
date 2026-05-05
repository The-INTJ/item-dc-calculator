'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
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
  const [registering, setRegistering] = useState(false);

  const handleClick = async () => {
    setRegistering(true);
    await contestApi.registerAsContestant(contestId, userDisplayName);
    setRegistering(false);
  };

  return (
    <section className="contestant-cta" aria-label={`Register as a ${contestantLabel}`}>
      <p className="contestant-cta__prompt">
        Ready to compete? Sign up — you'll name your {entryLabel.toLowerCase()} once you're matched up.
      </p>
      <Button
        variant="primary"
        onClick={handleClick}
        disabled={registering}
      >
        {registering ? 'Registering...' : `Be a ${contestantLabel}`}
      </Button>
    </section>
  );
}
