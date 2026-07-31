'use client';

import { Button } from '@/components/ui';
import type { Contest } from '../../contexts/contest/contestTypes';
import { getContestantLabel } from '../../lib/domain/contestLabels';

interface ContestDetailHeaderProps {
  contest: Contest;
  contestId: string;
}

/** Title block: what the contest is, how big it is, and the way to the big screen. */
export function ContestDetailHeader({ contest, contestId }: ContestDetailHeaderProps) {
  const topic = contest.config?.topic ?? 'Contest';
  const contestantLabel = getContestantLabel(contest.config);
  const contestantCount = contest.contestants?.length ?? 0;
  const roundCount = contest.rounds?.length ?? 0;

  return (
    <section className="contest-detail-header">
      <div className="contest-detail-header__meta">
        <span className="eyebrow">{topic}</span>
        <span aria-hidden="true">/</span>
        <span className="muted">Live updates</span>
      </div>
      <h1>{contest.name}</h1>
      <p>
        {roundCount} rounds / {contestantCount} {contestantCount === 1 ? contestantLabel.toLowerCase() : `${contestantLabel.toLowerCase()}s`}
      </p>
      <Button
        href={`/contest/${contestId}/display`}
        variant="secondary"
        size="sm"
      >
        Display mode
      </Button>
    </section>
  );
}
