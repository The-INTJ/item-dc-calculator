'use client';

import type { Contest } from '../../lib/globals/types';
import { buildRoundSummary } from '../../lib/helpers/uiMappings';
import { RoundCard } from '../ui/RoundCard';

interface AdminRoundOverviewProps {
  contest: Contest;
}

export function AdminRoundOverview({ contest }: AdminRoundOverviewProps) {
  const roundSummary = buildRoundSummary(contest);

  return (
    <section className="admin-details-section">
      <h3>Round snapshot</h3>
      <RoundCard round={roundSummary} variant="compact" />
    </section>
  );
}
