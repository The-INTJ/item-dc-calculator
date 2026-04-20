'use client';

import { useEffect, useMemo, useRef } from 'react';
import type {
  BracketContestant,
  BracketMatchup,
  BracketRound,
  BracketRoundStatus,
} from '@/contest/lib/presentation/buildBracketRoundsFromContest';

interface ContestRoundNavigatorProps {
  rounds: BracketRound[];
  activeRoundId: string | null;
  viewedRoundId: string | null;
  onViewRound: (roundId: string) => void;
  onVoteRound: (roundId: string) => void;
}

function statusLabel(status: BracketRoundStatus): string {
  if (status === 'active') return 'Now voting';
  if (status === 'closed') return 'Closed';
  if (status === 'pending') return 'Not seeded';
  return 'Upcoming';
}

function shortStatusLabel(status: BracketRoundStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  if (status === 'pending') return 'Pending';
  return 'Upcoming';
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return String(score);
}

function MatchupRow({ contestant, winnerId }: { contestant: BracketContestant; winnerId: string | null | undefined }) {
  const isWinner = Boolean(winnerId && contestant.id === winnerId);
  const className = isWinner
    ? 'contest-rounds__matchup-row contest-rounds__matchup-row--winner'
    : 'contest-rounds__matchup-row';

  return (
    <div className={className}>
      <p className="contest-rounds__matchup-name">{contestant.name}</p>
      <span className="contest-rounds__matchup-score">{formatScore(contestant.score ?? null)}</span>
    </div>
  );
}

function HeroMatchup({ matchup }: { matchup: BracketMatchup }) {
  return (
    <li className="contest-rounds__matchup">
      <MatchupRow contestant={matchup.contestantA} winnerId={matchup.winnerId} />
      <MatchupRow contestant={matchup.contestantB} winnerId={matchup.winnerId} />
    </li>
  );
}

export function ContestRoundNavigator({
  rounds,
  activeRoundId,
  viewedRoundId,
  onViewRound,
  onVoteRound,
}: ContestRoundNavigatorProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const viewedRound = useMemo(() => {
    if (!viewedRoundId) return rounds[0] ?? null;
    return rounds.find((round) => round.id === viewedRoundId) ?? rounds[0] ?? null;
  }, [rounds, viewedRoundId]);

  // Scroll the viewed tab into view when it changes (helpful on mobile).
  useEffect(() => {
    const container = tabListRef.current;
    if (!container || !viewedRound) return;
    const tab = container.querySelector<HTMLButtonElement>(`[data-round-id="${viewedRound.id}"]`);
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [viewedRound]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + rounds.length) % rounds.length;
    const nextRound = rounds[nextIndex];
    if (!nextRound) return;
    onViewRound(nextRound.id);
    const container = tabListRef.current;
    container?.querySelector<HTMLButtonElement>(`[data-round-id="${nextRound.id}"]`)?.focus();
  };

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
        <nav
          ref={tabListRef}
          className="contest-rounds__tabs"
          role="tablist"
          aria-label="Select a round"
        >
          {rounds.map((round, index) => {
            const isViewed = viewedRound?.id === round.id;
            const classes = [
              'contest-rounds__tab',
              `contest-rounds__tab--${round.status}`,
              isViewed ? 'contest-rounds__tab--viewed' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={round.id}
                type="button"
                role="tab"
                aria-selected={isViewed}
                aria-controls={`contest-round-panel-${round.id}`}
                tabIndex={isViewed ? 0 : -1}
                data-round-id={round.id}
                className={classes}
                onClick={() => onViewRound(round.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span className="contest-rounds__tab-label">{round.name}</span>
                <span className="contest-rounds__tab-status">{shortStatusLabel(round.status)}</span>
              </button>
            );
          })}
        </nav>
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
              {viewedRound.matchups.map((matchup) => (
                <HeroMatchup key={matchup.id} matchup={matchup} />
              ))}
            </ol>
          )}

          {viewedRound.status === 'active' && (
            <button
              type="button"
              className="contest-rounds__vote-cta"
              onClick={() => onVoteRound(viewedRound.id)}
            >
              Vote this round
            </button>
          )}

          {viewedRound.status === 'upcoming' && activeRoundId && activeRoundId !== viewedRound.id && (
            <p className="contest-rounds__hint">Voting will open when this round becomes active.</p>
          )}

          {viewedRound.status === 'closed' && (
            <p className="contest-rounds__hint">Voting closed for this round.</p>
          )}
        </article>
      )}
    </section>
  );
}
