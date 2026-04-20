'use client';

import { useParams } from 'next/navigation';
import { ContestDisplay } from '@/contest/components/ui/ContestDisplay';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';

export default function ContestDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const { contest, matchups, status } = useResolvedContest(id);

  if (status === 'loading') {
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

  return <ContestDisplay contest={contest} matchups={matchups} />;
}
