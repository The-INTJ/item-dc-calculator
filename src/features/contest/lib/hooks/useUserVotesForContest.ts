'use client';

import { useCallback, useEffect, useState } from 'react';
import { contestApi } from '../api/contestApi';

interface UseUserVotesForContestResult {
  votedMatchupIds: Set<string>;
  refresh: () => void;
  loading: boolean;
}

/**
 * Loads the score entries the current user has submitted for a contest and
 * exposes the set of matchup ids they've voted on. VoteModal calls
 * `refresh` after a successful submit so the navigator can swap "Vote" →
 * "Change vote" and show a "Voted" indicator immediately.
 */
export function useUserVotesForContest(
  contestId: string | null,
  userId: string | null,
): UseUserVotesForContestResult {
  const [votedMatchupIds, setVotedMatchupIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!contestId || !userId) {
      setVotedMatchupIds(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);

    contestApi
      .getScoresForUser(contestId, userId)
      .then((result) => {
        if (cancelled) return;
        if (!result.success || !result.data) {
          setVotedMatchupIds(new Set());
          return;
        }
        const next = new Set<string>();
        for (const score of result.data) {
          if (score.matchupId) next.add(score.matchupId);
        }
        setVotedMatchupIds(next);
      })
      .catch(() => {
        if (!cancelled) setVotedMatchupIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contestId, userId, tick]);

  return { votedMatchupIds, refresh, loading };
}
