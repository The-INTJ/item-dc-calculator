'use client';

import { useMemo } from 'react';
import type { Contest, Entry, Matchup } from '../../contexts/contest/contestTypes';

export type MyMatchupEntry = { matchup: Matchup; entry: Entry };

/**
 * The viewer's own entries in matchups still to be judged, in bracket order.
 * Scored matchups drop out — there is nothing left to name once the votes are
 * in. `pendingEntryCount` is how many of them still need a name, which is what
 * the nudge banner counts.
 */
export function useMyMatchupEntries(contest: Contest, matchups: Matchup[], userId: string | null) {
  const myContestantId = useMemo(
    () => (userId ? contest.contestants.find((c) => c.userId === userId)?.id ?? null : null),
    [contest.contestants, userId],
  );

  const entries = useMemo<MyMatchupEntry[]>(() => {
    if (!myContestantId) return [];
    const list: MyMatchupEntry[] = [];
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

  const pendingEntryCount = entries.filter(({ entry }) => !entry.name?.trim()).length;

  return { entries, pendingEntryCount };
}
