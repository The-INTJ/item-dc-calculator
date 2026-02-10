'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import { getEntriesForRound } from '../helpers/contestGetters';
import { getEffectiveConfig } from '../helpers/validation';
import { buildScoreDefaults, mergeScoreMaps, buildScoresFromEntries, isBreakdownKey } from '../helpers/scoreUtils';
import { buildEntrySummaries } from '../helpers/uiMappings';
import type { Contest, ScoreBreakdown, ScoreEntry } from '../../contexts/contest/contestTypes';
import { contestApi } from '../api/contestApi';

type ScoreByDrinkId = Record<string, Record<string, number>>;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Self-contained hook for voting on entries within a specific contest round.
 * Manages local score state, submission to the API, and status tracking.
 * Pre-fills scores from the user's existing votes when available.
 */
export function useRoundVoting(contest: Contest | null, roundId: string | null) {
  const { session, role } = useAuth();
  const [scores, setScores] = useState<ScoreByDrinkId>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const config = contest ? getEffectiveConfig(contest) : undefined;
  const categories = config?.attributes ?? [];
  const categoryIds = categories.map((a) => a.id);
  const entries = contest && roundId ? getEntriesForRound(contest, roundId) : [];
  const drinks = buildEntrySummaries(entries);
  const userId = session?.firebaseUid ?? session?.sessionId;

  // Reset scores and pre-fill from existing votes when round changes
  useEffect(() => {
    const drinkIds = entries.map((e) => e.id);
    if (drinkIds.length === 0 || categoryIds.length === 0) {
      setScores({});
      return;
    }

    // Start with defaults
    const defaults = buildScoreDefaults(drinkIds, categoryIds);

    // Fetch existing votes for pre-fill
    if (contest?.id && userId) {
      contestApi.getScoresForUser(contest.id, userId)
        .then((scores: ScoreEntry[]) => {
          if (!scores.length) {
            setScores(defaults);
            return;
          }

          // Filter to entries in this round and build score map
          const roundEntryIds = new Set(drinkIds);
          const roundScores = scores.filter((s) => roundEntryIds.has(s.entryId));
          const existing = buildScoresFromEntries(roundScores, categoryIds, config);
          setScores(mergeScoreMaps(defaults, existing));
        })
        .catch(() => setScores(defaults));
    } else {
      setScores(defaults);
    }

    setStatus('idle');
    setMessage(null);
  }, [roundId]); // Only reset when the selected round changes

  const updateScore = (drinkId: string, categoryId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [drinkId]: { ...(prev[drinkId] ?? {}), [categoryId]: value },
    }));
  };

  const submit = async () => {
    if (!contest?.id || !userId || !config) {
      setStatus('error');
      setMessage('No active contest or session.');
      return;
    }

    const voteEntries = Object.entries(scores)
      .map(([entryId, entryScores]) => {
        const breakdown = categoryIds.reduce<Partial<ScoreBreakdown>>((acc, cid) => {
          if (!isBreakdownKey(cid, config)) return acc;
          const value = entryScores?.[cid];
          if (Number.isFinite(value)) acc[cid] = value;
          return acc;
        }, {});
        return { entryId, breakdown };
      })
      .filter((e) => Object.keys(e.breakdown).length > 0);

    if (voteEntries.length === 0) {
      setStatus('error');
      setMessage('Enter at least one score before submitting.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const results = await Promise.all(
        voteEntries.map(({ entryId, breakdown }) =>
          contestApi.submitScore(contest.id, {
            entryId,
            userId,
            userName: session?.profile.displayName ?? 'Guest',
            userRole: role ?? 'voter',
            breakdown,
          }),
        ),
      );

      if (results.some((r) => r === null)) {
        throw new Error('Failed to submit scores.');
      }

      setStatus('success');
      setMessage('Scores submitted!');
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  };

  return { drinks, categories, scores, updateScore, submit, status, message, isSubmitting: status === 'submitting' };
}
