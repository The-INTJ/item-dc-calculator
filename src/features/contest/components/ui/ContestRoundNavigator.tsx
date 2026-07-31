'use client';

import { useMemo } from 'react';
import type {
  BracketRound,
  BracketRoundStatus,
} from '@/contest/lib/presentation/buildBracketRoundsFromContest';
import { getRoundVotingParticipation } from '@/contest/lib/presentation/votingParticipation';
import { HeroMatchup } from './HeroMatchup';
import { RoundTabs } from './RoundTabs';

interface ContestRoundNavigatorProps {
  rounds: BracketRound[];
  activeRoundId: string | null;
  viewedRoundId: string | null;
  votedMatchupIds: Set<string>;
  /** True when the viewer has an identity we can attribute votes to. */
  participationKnown: boolean;
  onViewRound: (roundId: string) => void;
  onVoteMatchup: (matchupId: string) => void;
}

function statusLabel(status: BracketRoundStatus): string {
  if (status === 'active') return 'Now voting';
  if (status === 'closed') return 'Closed';
  if (status === 'pending') return 'Not seeded';
  return 'Upcoming';
}

function ClosedRoundHint({
  round,
  votedMatchupIds,
  participationKnown,
}: {
  round: BracketRound;
  votedMatchupIds: Set<string>;
  participationKnown: boolean;
}) {
  const { votable, voted } = getRoundVotingParticipation(round, votedMatchupIds);
  if (!participationKnown || votable === 0 || voted >= votable) {
    return <p className="contest-rounds__hint">Voting closed for this round.</p>;
  }
  if (voted === 0) {
    return (
      <p className="contest-rounds__hint contest-rounds__hint--missed">
        Voting closed — you didn&apos;t vote in this round.
      </p>
    );
  }
  return (
    <p className="contest-rounds__hint contest-rounds__hint--missed">
      Voting closed — you voted in {voted} of {votable} matchups.
    </p>
  );
}

export function ContestRoundNavigator({
  rounds,
  activeRoundId,
  viewedRoundId,
  votedMatchupIds,
  participationKnown,
  onViewRound,
  onVoteMatchup,
}: ContestRoundNavigatorProps) {
  const viewedRound = useMemo(() => {
    if (!viewedRoundId) return rounds[0] ?? null;
    return rounds.find((round) => round.id === viewedRoundId) ?? rounds[0] ?? null;
  }, [rounds, viewedRoundId]);

  // A closed round is closed regardless of individual matchup phases — a
  // force-closed round must never present a vote affordance.
  const viewedRoundClosed = viewedRound?.status === 'closed';
  const hasLiveMatchup = Boolean(
    !viewedRoundClosed &&
      viewedRound?.matchups.some((m) => m.phase === 'shake' && !m.isBye && m.matchupId),
  );

  if (rounds.length === 0) {
    return (
      <section className="contest-rounds" aria-label="Contest rounds">
        <p className="contest-rounds__empty">No rounds have been set up yet.</p>
      </section>
    );
  }

  return (
    <section className="contest-rounds" aria-label="Contest rounds">
      {rounds.length > 1 && (
        <RoundTabs rounds={rounds} viewedRound={viewedRound} onViewRound={onViewRound} />
      )}

      {viewedRound && (
        <article
          id={`contest-round-panel-${viewedRound.id}`}
          className={`contest-rounds__hero contest-rounds__hero--${viewedRound.status}${
            viewedRound.status === 'active' ? ' contest-rounds__hero--active' : ''
          }`}
          role="tabpanel"
          aria-labelledby={`contest-round-tab-${viewedRound.id}`}
        >
          <header className="contest-rounds__hero-header">
            <p className="contest-rounds__eyebrow">{statusLabel(viewedRound.status)}</p>
            <h2 className="contest-rounds__hero-title">{viewedRound.name}</h2>
          </header>

          {viewedRound.matchups.length === 0 ? (
            <p className="contest-rounds__empty">No matchups have been set for this round yet.</p>
          ) : (
            <ol className="contest-rounds__matchups">
              {viewedRound.matchups.map((matchup, index) => (
                <HeroMatchup
                  key={matchup.id}
                  matchup={matchup}
                  index={index}
                  hasVoted={Boolean(matchup.matchupId && votedMatchupIds.has(matchup.matchupId))}
                  votable={!viewedRoundClosed && matchup.phase === 'shake'}
                  onVote={onVoteMatchup}
                />
              ))}
            </ol>
          )}

          {viewedRound.status === 'active' && !hasLiveMatchup && (
            <p className="contest-rounds__hint">
              Next matchup is being set up — voting opens shortly.
            </p>
          )}

          {viewedRound.status === 'upcoming' && activeRoundId && activeRoundId !== viewedRound.id && (
            <p className="contest-rounds__hint">Voting will open when this round becomes active.</p>
          )}

          {viewedRound.status === 'closed' && (
            <ClosedRoundHint
              round={viewedRound}
              votedMatchupIds={votedMatchupIds}
              participationKnown={participationKnown}
            />
          )}
        </article>
      )}
    </section>
  );
}
