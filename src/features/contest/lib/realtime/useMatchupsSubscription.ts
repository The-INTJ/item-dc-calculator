'use client';

import { useEffect } from 'react';
import { initializeFirebase } from '../firebase/config';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { subscribeToMatchups } from './firestoreSubscription';
import type { Matchup } from '../../contexts/contest/contestTypes';

function matchupFromSnapshot(id: string, data: Record<string, unknown>): Matchup {
  return {
    id,
    contestId: String(data.contestId ?? ''),
    roundId: String(data.roundId ?? ''),
    slotIndex: Number(data.slotIndex ?? 0),
    entryIds: Array.isArray(data.entryIds) ? (data.entryIds as string[]) : [],
    phase: (data.phase as Matchup['phase']) ?? 'set',
    winnerEntryId: (data.winnerEntryId as string | null | undefined) ?? null,
    advancesToMatchupId: (data.advancesToMatchupId as string | null | undefined) ?? null,
    advancesToSlot: (data.advancesToSlot as number | null | undefined) ?? null,
  };
}

/**
 * Subscribes to the matchups subcollection for a single contest so per-matchup
 * phase changes propagate to all clients live. Stored in the contest context
 * keyed by contestId.
 */
export function useMatchupsSubscription(contestId: string | null) {
  const { setMatchupsForContest } = useContestStore();

  useEffect(() => {
    if (!contestId) return;

    const { db } = initializeFirebase();
    if (!db) return;

    return subscribeToMatchups(db, contestId, matchupFromSnapshot, (matchups) => {
      setMatchupsForContest(contestId, matchups);
    });
  }, [contestId, setMatchupsForContest]);
}
