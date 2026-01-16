'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import { DrinkCard, RoundCard } from '@/src/mixology/ui';

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
  const { roundSummary, drinks, loading, error, refreshAll, lastUpdatedAt } = useMixologyData();

  const drinkCards = useMemo(
    () => drinks.map((drink) => <DrinkCard key={drink.id} drink={drink} variant="compact" />),
    [drinks]
  );
  const showEmptyState = !loading && !error && !roundSummary && drinks.length === 0;

  return (
    <div className="mixology-landing">
      <BracketHeader
        onRefresh={() => void refreshAll()}
        onVote={() => router.push('/mixology/vote')}
        updatedAt={lastUpdatedAt}
      />

      {loading && !roundSummary && <div className="mixology-card">Loading bracket data...</div>}
      {error && <div className="mixology-card">Error loading bracket data: {error}</div>}
      {showEmptyState && (
        <div className="mixology-card">
          We&apos;re setting up the bracket. Check back soon for the first round.
        </div>
      )}

      <section className="mixology-panels">
        {roundSummary ? (
          <RoundCard round={roundSummary} variant="compact" onClick={() => router.push('/mixology/vote')} />
        ) : (
          <div className="mixology-card">
            <h2>Current round</h2>
            <p>No round details are available yet.</p>
          </div>
        )}
        <BracketOverview hasRound={Boolean(roundSummary)} />
      </section>

      <section className="mixology-drink-grid">
        {drinkCards.length === 0 ? (
          <div className="mixology-card">No drinks submitted yet.</div>
        ) : (
          drinkCards
        )}
      </section>
    </div>
  );
}
