'use client';

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import {
  buildScoreDefaults,
  buildScoresFromEntries,
  mergeScoreMaps,
} from '../domain/scoreUtils';
import type { Contest, ScoreEntry } from '../../contexts/contest/contestTypes';
import type { BallotSubject } from './ballot-subject';
import { contestApi } from '../api/contestApi';

type ScoreByEntryId = Record<string, Record<string, number>>;

interface BallotPrefillArgs {
  contest: Contest | null;
  subject: BallotSubject;
  userId: string | undefined;
  authLoading: boolean;
  setScores: Dispatch<SetStateAction<ScoreByEntryId>>;
  /** Set once the voter touches a slider; see the guard below. */
  hasUserEditedRef: MutableRefObject<boolean>;
  /** A fresh ballot means any status from the previous one is stale. */
  onReset: () => void;
}

/**
 * Seeds the ballot whenever the subject changes: defaults first, then the
 * user's existing votes for this matchup once they arrive.
 */
export function useBallotPrefill({
  contest,
  subject,
  userId,
  authLoading,
  setScores,
  hasUserEditedRef,
  onReset,
}: BallotPrefillArgs) {
  const { categoryIds, entries, config, categoryKey, entryKey, matchupId } = subject;

  useEffect(() => {
    if (authLoading) return;

    const entryIds = entries.map((e) => e.id);
    if (entryIds.length === 0 || categoryIds.length === 0) {
      setScores({});
      return;
    }

    hasUserEditedRef.current = false;
    const defaults = buildScoreDefaults(entryIds, categoryIds);
    setScores(defaults);

    if (contest?.id && userId) {
      contestApi.getScoresForUser(contest.id, userId)
        .then((result) => {
          // The user started scoring while the fetch was in flight — their
          // in-progress ballot wins over the prefill.
          if (hasUserEditedRef.current) return;

          const userScores: ScoreEntry[] = result.success ? result.data ?? [] : [];
          if (!userScores.length) return;

          const matchupEntryIds = new Set(entryIds);
          const matchupScores = userScores.filter(
            (s) => matchupEntryIds.has(s.entryId) && (!matchupId || s.matchupId === matchupId || !s.matchupId),
          );
          const existing = buildScoresFromEntries(matchupScores, categoryIds, config);
          if (hasUserEditedRef.current) return;
          setScores(mergeScoreMaps(defaults, existing));
        })
        .catch(() => {});
    }

    onReset();
  }, [authLoading, categoryKey, contest?.id, entryKey, matchupId, userId]);
}
