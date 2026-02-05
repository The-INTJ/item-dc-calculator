'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BracketView, type BracketRound } from '@/contest/components/ui/BracketView';
import { useMixologyData } from '@/contest/contexts/MixologyDataContext';
import { buildBracketRoundsFromContest } from '@/contest/lib/helpers/buildRoundsFromContest';

function formatUpdatedAt(timestamp: number | null) {
  if (!timestamp) return 'Not refreshed yet.';
  return `Last updated at ${new Date(timestamp).toLocaleTimeString()}.`;
}

function BracketHeader({ onRefresh, onVote, updatedAt }: { onRefresh: () => void; onVote: () => void; updatedAt: number | null }) {
  return (
    <section className="mixology-hero">
      <h1>Mixology Bracket</h1>
      <p>Track the current round and see which drinks are advancing.</p>
      <p>{formatUpdatedAt(updatedAt)}</p>
      <div className="mixology-actions">
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
    <div className="mixology-card">
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
  const { contest, loading, error } = useMixologyData();

  const rounds: BracketRound[] = useMemo(() => {
    if (!contest) return [];
    return buildBracketRoundsFromContest(contest);
  }, [contest]);

  return (
    <div className="mixology-landing">
      <BracketHeader
        onRefresh={() => setUpdatedAt(Date.now())}
        onVote={() => router.push('/mixology/vote')}
        updatedAt={updatedAt}
      />

      <BracketOverview hasRound={rounds.length > 0} />
      {loading && <div className="mixology-card">Loading bracket...</div>}
      {error && <div className="mixology-card">Error: {error}</div>}
      {!loading && !error && <BracketView rounds={rounds} />}
    </div>
  );
}
