'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { setRecentContest } from '@/contest/lib/hooks/useRecentContest';
import { markContestVisited } from '@/contest/lib/hooks/useVisitedContests';
import { useUserVotesForContest } from '@/contest/lib/hooks/useUserVotesForContest';
import { useViewedRound } from '@/contest/lib/hooks/useViewedRound';
import { useMyMatchupEntries } from '@/contest/lib/hooks/useMyMatchupEntries';
import { ContestRoundNavigator } from '@/contest/components/ui/ContestRoundNavigator';
import { ContestantCta } from '@/contest/components/ui/ContestantCta';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { ContestDetailHeader } from '@/contest/components/contestPage/ContestDetailHeader';
import { MyMatchupEntriesSection } from '@/contest/components/contestPage/MyMatchupEntriesSection';
import { ContestantRoster } from '@/contest/components/contestPage/ContestantRoster';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { getContestantLabel, getEntryLabel } from '@/contest/lib/domain/contestLabels';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import type { Contest } from '@/contest/contexts/contest/contestTypes';

interface ContestPageClientProps {
  contestId: string;
  initialContest: Contest;
}

export default function ContestPageClient({ contestId, initialContest }: ContestPageClientProps) {
  const { session } = useAuth();
  const { contest: liveContest, matchups } = useResolvedContest(contestId);
  const contest = liveContest ?? initialContest;

  const { rounds, activeRoundId, viewedRoundId, viewRound } = useViewedRound(contest, matchups);
  const [selectedMatchupId, setSelectedMatchupId] = useState<string | null>(null);

  useEffect(() => {
    setRecentContest({ id: contest.id, name: contest.name });
    markContestVisited(contest.id);
  }, [contest.id, contest.name]);

  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = getUserContestRole(userId, contest);
  const { votedMatchupIds, refresh: refreshVotedMatchups } = useUserVotesForContest(
    contest.id,
    userId,
  );
  const contestantLabel = getContestantLabel(contest.config);
  const entryLabel = getEntryLabel(contest.config);
  const showContestantButton = userId && contestRole !== 'contestant';

  const { entries: myMatchupEntries, pendingEntryCount } = useMyMatchupEntries(
    contest,
    matchups,
    userId,
  );

  const selectedMatchup = selectedMatchupId
    ? matchups.find((m) => m.id === selectedMatchupId) ?? null
    : null;

  return (
    <div className="contest-detail-page">
      <ContestDetailHeader contest={contest} contestId={contestId} />

      <ContestRoundNavigator
        rounds={rounds}
        activeRoundId={activeRoundId}
        viewedRoundId={viewedRoundId}
        votedMatchupIds={votedMatchupIds}
        participationKnown={Boolean(userId)}
        onViewRound={viewRound}
        onVoteMatchup={setSelectedMatchupId}
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

      <MyMatchupEntriesSection
        contest={contest}
        entries={myMatchupEntries}
        pendingEntryCount={pendingEntryCount}
        entryLabel={entryLabel}
      />

      <ContestantRoster contest={contest} contestantLabel={contestantLabel} />

      {selectedMatchup && (
        <VoteModal
          open
          onClose={() => setSelectedMatchupId(null)}
          onSubmitted={refreshVotedMatchups}
          contest={contest}
          matchup={selectedMatchup}
        />
      )}
    </div>
  );
}
