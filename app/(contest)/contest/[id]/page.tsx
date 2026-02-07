'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useContestStore } from '@/src/features/contest/contexts/contest/ContestContext';
import { BracketView } from '@/contest/components/ui/BracketView';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { buildBracketRoundsFromContest } from '@/contest/lib/helpers/buildRoundsFromContest';

export default function ContestPage() {
  const { id } = useParams<{ id: string }>();
  const { contests } = useContestStore();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  const contest = contests.find((c) => c.id === id) ?? null;
  const rounds = contest ? buildBracketRoundsFromContest(contest) : [];

  if (!contest) {
    return (
      <div className="contest-landing">
        <div className="contest-card">Contest not found.</div>
      </div>
    );
  }

  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>{contest.name}</h1>
        <p>Click a round to vote.</p>
      </section>

      <BracketView rounds={rounds} onRoundClick={setSelectedRoundId} />

      {selectedRoundId && (
        <VoteModal
          open
          onClose={() => setSelectedRoundId(null)}
          contest={contest}
          roundId={selectedRoundId}
        />
      )}
    </div>
  );
}
