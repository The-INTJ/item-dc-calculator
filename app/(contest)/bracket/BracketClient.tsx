'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BracketView, type BracketRound } from '@/contest/components/ui/BracketView';
import { useActiveContest } from '@/contest/contexts/ActiveContestContext';
import { buildBracketRoundsFromContest } from '@/contest/lib/helpers/buildRoundsFromContest';

function formatUpdatedAt(timestamp: number | null) {
  if (!timestamp) return 'Not refreshed yet.';
  return `Last updated at ${new Date(timestamp).toLocaleTimeString()}.`;
}

function BracketHeader({ onRefresh, onVote, updatedAt }: { onRefresh: () => void; onVote: () => void; updatedAt: number | null }) {
  return (
    <section className="contest-hero">
      <h1>Contest Bracket</h1>
      <p>Track the current round and see which entries are advancing.</p>
      <p>{formatUpdatedAt(updatedAt)}</p>
      <div className="contest-actions">
        <button type="button" className="button-secondary" onClick={onRefresh}>
          Refresh
        </button>
        <button type="button" className="button-primary" onClick={onVote}>
          Go to voting
        </button>
      </div>
    </section>
  );
}

function BracketOverview({ hasRound }: { hasRound: boolean }) {
  return (
    <div className="contest-card">
      <h2>Bracket status</h2>
      {hasRound ? (
        <p>Current round details are ready for review.</p>
      ) : (
        <p>No active round is available yet.</p>
      )}
    </div>
  );
}

export function BracketClient() {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const { contest, loading, error } = useActiveContest();

  const rounds: BracketRound[] = useMemo(() => {
    if (!contest) return [];
    return buildBracketRoundsFromContest(contest);
  }, [contest]);

  return (
    <div className="contest-landing">
      <BracketHeader
        onRefresh={() => setUpdatedAt(Date.now())}
        onVote={() => router.push('/contest/vote')}
        updatedAt={updatedAt}
      />

      <BracketOverview hasRound={rounds.length > 0} />
      {loading && <div className="contest-card">Loading bracket...</div>}
      {error && <div className="contest-card">Error: {error}</div>}
      {!loading && !error && <BracketView rounds={rounds} />}
    </div>
  );
}
