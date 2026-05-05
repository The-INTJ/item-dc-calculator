'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { setRecentContest } from '@/contest/lib/hooks/useRecentContest';
import { markContestVisited } from '@/contest/lib/hooks/useVisitedContests';
import { ContestRoundNavigator } from '@/contest/components/ui/ContestRoundNavigator';
import { ContestantCta } from '@/contest/components/ui/ContestantCta';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { MatchupEntryNameForm } from '@/contest/components/ui/MatchupEntryNameForm';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { getContestantLabel, getEntryLabel } from '@/contest/lib/domain/contestLabels';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import { getActiveRoundIdFromMatchups } from '@/contest/lib/domain/matchupGetters';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';
import type { Contest, Entry, Matchup } from '@/contest/contexts/contest/contestTypes';

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
    markContestVisited(contest.id);
  }, [contest.id, contest.name]);

  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = getUserContestRole(userId, contest);
  const contestantLabel = getContestantLabel(contest.config);
  const entryLabel = getEntryLabel(contest.config);
  const showContestantButton = userId && contestRole !== 'contestant';
  const topic = contest.config?.topic ?? 'Contest';
  const contestantCount = contest.contestants?.length ?? 0;
  const roundCount = contest.rounds?.length ?? 0;

  const myContestantId = useMemo(
    () => (userId ? contest.contestants.find((c) => c.userId === userId)?.id ?? null : null),
    [contest.contestants, userId],
  );

  const myMatchupEntries = useMemo<Array<{ matchup: Matchup; entry: Entry }>>(() => {
    if (!myContestantId) return [];
    const list: Array<{ matchup: Matchup; entry: Entry }> = [];
    for (const matchup of matchups) {
      if (matchup.phase === 'scored') continue;
      const entry = matchup.entries.find((e) => e.contestantId === myContestantId);
      if (entry) list.push({ matchup, entry });
    }
    list.sort((a, b) => {
      const ai = (contest.rounds ?? []).findIndex((r) => r.id === a.matchup.roundId);
      const bi = (contest.rounds ?? []).findIndex((r) => r.id === b.matchup.roundId);
      if (ai !== bi) return ai - bi;
      return a.matchup.slotIndex - b.matchup.slotIndex;
    });
    return list;
  }, [matchups, myContestantId, contest.rounds]);

  const pendingEntryCount = myMatchupEntries.filter(({ entry }) => !entry.name?.trim()).length;

  const selectedMatchup = selectedMatchupId
    ? matchups.find((m) => m.id === selectedMatchupId) ?? null
    : null;

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
          {roundCount} rounds / {contestantCount} {contestantCount === 1 ? contestantLabel.toLowerCase() : `${contestantLabel.toLowerCase()}s`}
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

      {pendingEntryCount > 0 && (
        <aside className="matchup-entry-banner" role="status">
          <strong>
            {pendingEntryCount === 1
              ? `1 ${entryLabel.toLowerCase()} needs a name.`
              : `${pendingEntryCount} ${entryLabel.toLowerCase()}s need names.`}
          </strong>
          <span>Scroll down to fill in your matchup entries.</span>
        </aside>
      )}

      {myMatchupEntries.length > 0 && (
        <section className="matchup-entry-section" aria-label="Your matchup entries">
          <h2>Your matchup {myMatchupEntries.length === 1 ? entryLabel.toLowerCase() : `${entryLabel.toLowerCase()}s`}</h2>
          <div className="matchup-entry-section__list">
            {myMatchupEntries.map(({ matchup, entry }) => (
              <MatchupEntryNameForm
                key={entry.id}
                contest={contest}
                matchup={matchup}
                entry={entry}
              />
            ))}
          </div>
        </section>
      )}

      <section className="contest-entry-preview" aria-label={`${contestantLabel} preview`}>
        <div className="contest-entry-preview__header">
          <h2>{contestantCount === 1 ? contestantLabel : `${contestantLabel}s`}</h2>
          <span className="muted">{contestantCount}</span>
        </div>
        {contest.contestants.length === 0 ? (
          <p className="contest-empty">No {contestantLabel.toLowerCase()}s have registered yet.</p>
        ) : (
          <div className="contest-entry-preview__list">
            {contest.contestants.slice(0, 6).map((c) => (
              <div key={c.id} className="contest-entry-row">
                <span className="contest-entry-row__image" aria-hidden="true" />
                <span className="contest-entry-row__body">
                  <strong>{c.displayName}</strong>
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
