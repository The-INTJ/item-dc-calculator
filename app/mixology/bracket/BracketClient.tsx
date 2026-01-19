'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BracketView } from '@/src/mixology/ui';
import type { BracketRound } from '@/src/mixology/ui/BracketView';

const dummyRounds: BracketRound[] = [
  {
    id: 'round-16',
    name: 'Round of 16',
    status: 'closed',
    matchups: [
      {
        id: 'm1',
        contestantA: { id: 'd1', name: 'Velvet Rye', score: 82 },
        contestantB: { id: 'd2', name: 'Midnight Citrus', score: 76 },
        winnerId: 'd1',
      },
      {
        id: 'm2',
        contestantA: { id: 'd3', name: 'Golden Bloom', score: 88 },
        contestantB: { id: 'd4', name: 'Cask Ember', score: 71 },
        winnerId: 'd3',
      },
      {
        id: 'm3',
        contestantA: { id: 'd5', name: 'Opal Spritz', score: 79 },
        contestantB: { id: 'd6', name: 'Nightshade Fizz', score: 81 },
        winnerId: 'd6',
      },
      {
        id: 'm4',
        contestantA: { id: 'd7', name: 'Copper Coast', score: 85 },
        contestantB: { id: 'd8', name: 'Juniper Dusk', score: 77 },
        winnerId: 'd7',
      },
    ],
  },
  {
    id: 'round-8',
    name: 'Quarterfinals',
    status: 'closed',
    matchups: [
      {
        id: 'm5',
        contestantA: { id: 'd1', name: 'Velvet Rye', score: 84 },
        contestantB: { id: 'd3', name: 'Golden Bloom', score: 89 },
        winnerId: 'd3',
      },
      {
        id: 'm6',
        contestantA: { id: 'd6', name: 'Nightshade Fizz', score: 83 },
        contestantB: { id: 'd7', name: 'Copper Coast', score: 80 },
        winnerId: 'd6',
      },
    ],
  },
  {
    id: 'round-4',
    name: 'Semifinals',
    status: 'active',
    matchups: [
      {
        id: 'm7',
        contestantA: { id: 'd3', name: 'Golden Bloom', score: 90 },
        contestantB: { id: 'd6', name: 'Nightshade Fizz', score: 88 },
        winnerId: null,
      },
    ],
  },
  {
    id: 'round-2',
    name: 'Finals',
    status: 'upcoming',
    matchups: [
      {
        id: 'm8',
        contestantA: { id: 'tbd-a', name: 'TBD', score: null },
        contestantB: { id: 'tbd-b', name: 'TBD', score: null },
        winnerId: null,
      },
    ],
  },
];

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

  return (
    <div className="mixology-landing">
      <BracketHeader
        onRefresh={() => setUpdatedAt(Date.now())}
        onVote={() => router.push('/mixology/vote')}
        updatedAt={updatedAt}
      />

      <BracketOverview hasRound />
      <BracketView rounds={dummyRounds} />
    </div>
  );
}
