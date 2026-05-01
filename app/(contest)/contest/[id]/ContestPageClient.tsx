'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { setRecentContest } from '@/contest/lib/hooks/useRecentContest';
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

  const [userPickedRoundId, setUserPickedRoundId] = useState<string | null>(null);
  const [selectedMatchupId, setSelectedMatchupId] = useState<string | null>(null);

  const viewedRoundId =
    userPickedRoundId && rounds.some((r) => r.id === userPickedRoundId)
      ? userPickedRoundId
      : fallbackRoundId;

  useEffect(() => {
    setRecentContest({ id: contest.id, name: contest.name });
  }, [contest.id, contest.name]);

  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = getUserContestRole(userId, contest);
  const contestantLabel = getContestantLabel(contest.config);
  const entryLabel = getEntryLabel(contest.config);
  const showContestantButton = userId && contestRole !== 'contestant';
  const topic = contest.config?.topic ?? 'Contest';
  const entryCount = contest.entries?.length ?? 0;
  const roundCount = contest.rounds?.length ?? 0;

  const selectedMatchup = selectedMatchupId
    ? matchups.find((m) => m.id === selectedMatchupId) ?? null
    : null;

  const handleVoteRound = (roundId: string) => {
    const firstShake = matchups
      .filter((m) => m.roundId === roundId && m.phase === 'shake')
      .sort((a, b) => a.slotIndex - b.slotIndex)[0];
    if (firstShake) setSelectedMatchupId(firstShake.id);
  };

  const handleVoteMatchup = (matchupId: string) => {
    setSelectedMatchupId(matchupId);
  };

  return (
    <div className="contest-detail-page">
      <section className="contest-detail-header">
        <div className="contest-detail-header__meta">
          <span className="eyebrow">{topic}</span>
          <span aria-hidden="true">/</span>
          <span className="muted">Live updates</span>
        </div>
        <h1>{contest.name}</h1>
        <p>
          {roundCount} rounds / {entryCount} {entryCount === 1 ? entryLabel.toLowerCase() : `${entryLabel.toLowerCase()}s`}
        </p>
        <Link
          href={`/contest/${contestId}/display`}
          className="btn btn--secondary btn--sm contest-hero__display-link"
        >
          Display mode
        </Link>
      </section>

      <ContestRoundNavigator
        rounds={rounds}
        activeRoundId={activeRoundId}
        viewedRoundId={viewedRoundId}
        onViewRound={setUserPickedRoundId}
        onVoteRound={handleVoteRound}
        onVoteMatchup={handleVoteMatchup}
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

      <section className="contest-entry-preview" aria-label={`${entryLabel} preview`}>
        <div className="contest-entry-preview__header">
          <h2>{entryCount === 1 ? entryLabel : `${entryLabel}s`}</h2>
          <span className="muted">{entryCount}</span>
        </div>
        {contest.entries.length === 0 ? (
          <p className="contest-empty">No {entryLabel.toLowerCase()}s have been submitted yet.</p>
        ) : (
          <div className="contest-entry-preview__list">
            {contest.entries.slice(0, 6).map((entry) => (
              <div key={entry.id} className="contest-entry-row">
                <span className="contest-entry-row__image" aria-hidden="true" />
                <span className="contest-entry-row__body">
                  <strong>{entry.name || 'Unnamed entry'}</strong>
                  <span>by {entry.submittedBy}</span>
                </span>
                <span className="badge badge--pending">
                  {(entry.voteCount ?? 0) > 0 ? `${entry.voteCount} votes` : 'Unscored'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

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
