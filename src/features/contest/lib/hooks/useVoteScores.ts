'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import { useActiveContest } from '../../contexts/ActiveContestContext';
import {
  buildScoreDefaults,
  buildScoresFromEntries,
  mergeScoreMaps,
} from '../helpers/scoreUtils';
import type { ScoreEntry } from '../../contexts/contest/contestTypes';

export type ScoreByDrinkId = Record<string, Record<string, number>>;

export interface UseVoteScoresResult {
  /** Current draft scores keyed by drinkId -> categoryId -> value */
  scores: ScoreByDrinkId;
  /** Update a single score value */
  updateScore: (drinkId: string, categoryId: string, value: number) => void;
  /** Whether scores are being loaded from remote */
  isLoadingRemote: boolean;
  /** The judge identifier used for score queries */
  judgeId: string | undefined;
}

/**
 * Custom hook that manages vote score state with layered initialization:
 * 1. Initializes with default values (5) for all drink/category combinations
 * 2. Overlays locally stored session votes
 * 3. Fetches and overlays remote scores from the API
 *
 * Provides a clean API for updating individual score values.
 */
export function useVoteScores(): UseVoteScoresResult {
  const { session } = useAuth();
  const { contest, drinks } = useActiveContest();

  const [draftScores, setDraftScores] = useState<ScoreByDrinkId>({});
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const hasLoadedRemoteScores = useRef(false);

  const judgeId = session?.firebaseUid ?? session?.sessionId;
  const contestId = contest?.id;

  // Memoize derived arrays to prevent infinite re-renders
  const categoryIds = useMemo(
    () => (contest?.config?.attributes ?? []).map((attr) => attr.id),
    [contest?.config?.attributes]
  );

  const drinkIds = useMemo(() => drinks.map((d) => d.id), [drinks]);

  // Reset remote load flag when contest or judge changes
  useEffect(() => {
    hasLoadedRemoteScores.current = false;
  }, [contestId, judgeId]);

  // Step 1: Initialize with defaults when drinks/categories change
  useEffect(() => {
    if (drinkIds.length === 0 || categoryIds.length === 0) {
      setDraftScores({});
      return;
    }

    const defaults = buildScoreDefaults(drinkIds, categoryIds);
    setDraftScores((prev) => mergeScoreMaps(defaults, prev));
  }, [categoryIds, drinkIds]);

  // Step 2: Fetch and overlay remote scores
  useEffect(() => {
    if (!contestId || !judgeId || categoryIds.length === 0 || hasLoadedRemoteScores.current) {
      return;
    }

    let isActive = true;

    const loadRemoteScores = async () => {
      setIsLoadingRemote(true);
      try {
        const response = await fetch(
          `/api/contest/contests/${contestId}/scores?judgeId=${encodeURIComponent(judgeId)}`
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { scores?: ScoreEntry[] };
        if (!isActive) return;

        const mapped = buildScoresFromEntries(payload.scores ?? [], categoryIds);
        setDraftScores((prev) => mergeScoreMaps(prev, mapped));
        hasLoadedRemoteScores.current = true;
      } catch {
        if (isActive) {
          hasLoadedRemoteScores.current = true;
        }
      } finally {
        if (isActive) {
          setIsLoadingRemote(false);
        }
      }
    };

    void loadRemoteScores();

    return () => {
      isActive = false;
    };
  }, [categoryIds, contestId, judgeId]);

  const updateScore = (drinkId: string, categoryId: string, value: number) => {
    setDraftScores((prev) => ({
      ...prev,
      [drinkId]: {
        ...(prev[drinkId] ?? {}),
        [categoryId]: value,
      },
    }));
  };

  return {
    scores: draftScores,
    updateScore,
    isLoadingRemote,
    judgeId,
  };
}
