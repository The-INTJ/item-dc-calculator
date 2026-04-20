'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { ContestRoundNavigator } from '@/contest/components/ui/ContestRoundNavigator';
import { ContestantCta } from '@/contest/components/ui/ContestantCta';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { getContestantLabel, getEntryLabel } from '@/contest/lib/domain/contestLabels';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import { getActiveRoundIdFromMatchups } from '@/contest/lib/domain/matchupGetters';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';
import type { Contest } from '@/contest/contexts/contest/contestTypes';

interface ContestPageClientProps {
  contestId: string;
  initialContest: Contest;
}

export default function ContestPageClient({ contestId, initialContest }: ContestPageClientProps) {
  const { session } = useAuth();
  const { contest: liveContest, matchups } = useResolvedContest(contestId);
  const contest = liveContest ?? initialContest;

  const rounds = useMemo(
    () => buildBracketRoundsFromContest(contest, matchups),
    [contest, matchups],
  );
  const activeRoundId = useMemo(
    () => getActiveRoundIdFromMatchups(contest.rounds ?? [], matchups),
    [contest.rounds, matchups],
  );
  const fallbackRoundId = activeRoundId ?? rounds[0]?.id ?? null;

  const [viewedRoundId, setViewedRoundId] = useState<string | null>(fallbackRoundId);
  const [selectedMatchupId, setSelectedMatchupId] = useState<string | null>(null);

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

  const selectedMatchup = selectedMatchupId
    ? matchups.find((m) => m.id === selectedMatchupId) ?? null
    : null;

  const handleVoteRound = (roundId: string) => {
    const firstShake = matchups
      .filter((m) => m.roundId === roundId && m.phase === 'shake')
      .sort((a, b) => a.slotIndex - b.slotIndex)[0];
    if (firstShake) setSelectedMatchupId(firstShake.id);
  };

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
        onVoteRound={handleVoteRound}
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

      {selectedMatchup && (
        <VoteModal
          open
          onClose={() => setSelectedMatchupId(null)}
          contest={contest}
          matchup={selectedMatchup}
        />
      )}
    </div>
  );
}
