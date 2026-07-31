'use client';

import { useEffect, useRef } from 'react';
import type {
  BracketRound,
  BracketRoundStatus,
} from '@/contest/lib/presentation/buildBracketRoundsFromContest';

function shortStatusLabel(status: BracketRoundStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  if (status === 'pending') return 'Pending';
  return 'Upcoming';
}

/**
 * Horizontally scrollable round tab list with arrow-key navigation.
 */
export function RoundTabs({
  rounds,
  viewedRound,
  onViewRound,
}: {
  rounds: BracketRound[];
  viewedRound: BracketRound | null;
  onViewRound: (roundId: string) => void;
}) {
  const tabListRef = useRef<HTMLDivElement>(null);

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

  return (
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
            id={`contest-round-tab-${round.id}`}
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
  );
}
