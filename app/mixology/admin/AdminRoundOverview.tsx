'use client';

import type { Contest } from '@/src/mixology/backend';
import { buildRoundSummary } from '@/src/mixology/data/uiMappings';
import { RoundCard } from '@/src/mixology/ui';

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
