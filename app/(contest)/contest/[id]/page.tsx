'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { BracketView } from '@/contest/components/ui/BracketView';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';

export default function ContestPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const { contest, status } = useResolvedContest(id);
  const rounds = contest ? buildBracketRoundsFromContest(contest) : [];

  if (status === 'loading') {
    return (
      <div className="contest-landing">
        <div className="contest-card">Loading contest...</div>
      </div>
    );
  }

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
        <div className="contest-actions">
          <Link href={`/contest/${id}/display`} className="button-secondary">
            Open display mode
          </Link>
        </div>
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
