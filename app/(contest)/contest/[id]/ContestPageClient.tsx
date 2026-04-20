'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { ContestRoundNavigator } from '@/contest/components/ui/ContestRoundNavigator';
import { ContestantCta } from '@/contest/components/ui/ContestantCta';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { getContestantLabel, getEntryLabel } from '@/contest/lib/domain/contestLabels';
import { getActiveRoundId } from '@/contest/lib/domain/contestGetters';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';
import type { Contest } from '@/contest/contexts/contest/contestTypes';

interface ContestPageClientProps {
  contestId: string;
  initialContest: Contest;
}

export default function ContestPageClient({ contestId, initialContest }: ContestPageClientProps) {
  const { session } = useAuth();
  const { contest: liveContest } = useResolvedContest(contestId);
  const contest = liveContest ?? initialContest;

  const rounds = buildBracketRoundsFromContest(contest);
  const activeRoundId = getActiveRoundId(contest);
  const fallbackRoundId = activeRoundId ?? rounds[0]?.id ?? null;

  const [viewedRoundId, setViewedRoundId] = useState<string | null>(fallbackRoundId);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  // If the active round changes server-side while the page is open (or we
  // previously defaulted before rounds loaded), keep the viewer in sync with
  // a sensible default.
  useEffect(() => {
    if (!fallbackRoundId) return;
    setViewedRoundId((prev) => {
      if (prev && rounds.some((round) => round.id === prev)) return prev;
      return fallbackRoundId;
    });
  }, [fallbackRoundId, rounds]);

  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = getUserContestRole(userId, contest);
  const contestantLabel = getContestantLabel(contest.config);
  const entryLabel = getEntryLabel(contest.config);
  const showContestantButton = userId && contestRole !== 'contestant';

  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>{contest.name}</h1>
        <Link
          href={`/contest/${contestId}/display`}
          className="button-secondary contest-hero__display-link"
        >
          Display mode
        </Link>
      </section>

      <ContestRoundNavigator
        rounds={rounds}
        activeRoundId={activeRoundId}
        viewedRoundId={viewedRoundId}
        onViewRound={setViewedRoundId}
        onVoteRound={setSelectedRoundId}
      />

      {showContestantButton && userId && (
        <ContestantCta
          contestId={contest.id}
          userDisplayName={session?.profile.displayName ?? 'Guest'}
          contestantLabel={contestantLabel}
          entryLabel={entryLabel}
        />
      )}

      {contestRole === 'contestant' && (
        <section className="contest-actions">
          <p className="contest-role-badge">You are a {contestantLabel}</p>
        </section>
      )}

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
