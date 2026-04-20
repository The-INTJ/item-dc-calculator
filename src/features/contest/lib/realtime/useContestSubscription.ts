'use client';

import { useEffect } from 'react';
import { initializeFirebase } from '../firebase/config';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { createPacedSubscription } from './firestoreSubscription';
import type { Contest, Voter } from '../../contexts/contest/contestTypes';

function contestFromSnapshot(id: string, data: Record<string, unknown>): Contest {
  return {
    ...data,
    id,
    voters: ((data.voters ?? data.judges ?? []) as Voter[]),
  } as Contest;
}

/**
 * Subscribes to real-time updates for a single contest document.
 *
 * Entry aggregates (sumScore, voteCount) update live as votes come in,
 * so round cards refresh automatically. Uses paced subscriptions to batch
 * rapid concurrent votes into fewer React state updates.
 */
export function useContestSubscription(contestId: string | null) {
  const { upsertContest } = useContestStore();

  useEffect(() => {
    if (!contestId) return;

    const { db } = initializeFirebase();
    if (!db) return;

    return createPacedSubscription(
      db,
      'contests',
      contestId,
      contestFromSnapshot,
      upsertContest,
    );
  }, [contestId, upsertContest]);
}
