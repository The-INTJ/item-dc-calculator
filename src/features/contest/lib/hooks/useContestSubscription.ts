'use client';

import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '../firebase/config';
import { useContestStore } from '../../contexts/contest/ContestContext';
import type { Contest, Voter } from '../../contexts/contest/contestTypes';

/** Minimum ms between context updates to pace rapid snapshot bursts. */
const PACE_MS = 300;

/**
 * Subscribes to real-time updates for a single contest document.
 * Entry aggregates (sumScore, voteCount) update live as votes come in,
 * so BracketView scores refresh automatically.
 *
 * Includes trailing-edge throttle (PACE_MS) to batch rapid concurrent votes
 * into fewer React state updates.
 */
export function useContestSubscription(contestId: string | null) {
  const { upsertContest } = useContestStore();
  const pendingRef = useRef<Contest | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!contestId) return;

    const { db } = initializeFirebase();
    if (!db) return;

    const unsubscribe = onSnapshot(
      doc(db, 'contests', contestId),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const contest = {
          ...data,
          id: snapshot.id,
          voters: (data.voters ?? data.judges ?? []) as Voter[],
        } as Contest;

        // Paced: queue latest snapshot, flush on trailing edge
        pendingRef.current = contest;
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            if (pendingRef.current) {
              upsertContest(pendingRef.current);
              pendingRef.current = null;
            }
            timerRef.current = undefined;
          }, PACE_MS);
        }
      },
      (error) => console.error('[ContestSubscription]', error),
    );

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Flush any pending update on cleanup
        if (pendingRef.current) {
          upsertContest(pendingRef.current);
          pendingRef.current = null;
        }
      }
    };
  }, [contestId, upsertContest]);
}
