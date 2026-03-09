'use client';

import { useParams } from 'next/navigation';
import { ContestDisplay } from '@/contest/components/ui/ContestDisplay';
import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import { useContestSubscription } from '@/contest/lib/hooks/useContestSubscription';

export default function ContestDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const { contests } = useContestStore();

  useContestSubscription(id);

  const contest = contests.find((item) => item.id === id) ?? null;

  if (!contest && contests.length === 0) {
    return (
      <div className="contest-display-page contest-display-page__state">
        <div className="contest-display-page__card">Loading display...</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contest-display-page contest-display-page__state">
        <div className="contest-display-page__card">Contest not found.</div>
      </div>
    );
  }

  return <ContestDisplay contest={contest} />;
}