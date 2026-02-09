'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import { getEntriesForRound } from '../helpers/contestGetters';
import { getEffectiveConfig } from '../helpers/validation';
import { buildScoreDefaults, isBreakdownKey } from '../helpers/scoreUtils';
import { buildEntrySummaries } from '../helpers/uiMappings';
import type { Contest, ScoreBreakdown } from '../../contexts/contest/contestTypes';

type ScoreByDrinkId = Record<string, Record<string, number>>;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Self-contained hook for voting on entries within a specific contest round.
 * Manages local score state, submission to the API, and status tracking.
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
  const judgeId = session?.firebaseUid ?? session?.sessionId;

  // Reset scores when round changes
  useEffect(() => {
    const drinkIds = entries.map((e) => e.id);
    if (drinkIds.length === 0 || categoryIds.length === 0) {
      setScores({});
      return;
    }
    setScores(buildScoreDefaults(drinkIds, categoryIds));
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
    if (!contest?.id || !judgeId || !config) {
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
      const responses = await Promise.all(
        voteEntries.map(({ entryId, breakdown }) =>
          fetch(`/api/contest/contests/${contest.id}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryId,
              judgeId,
              judgeName: session?.profile.displayName ?? 'Guest',
              judgeRole: role ?? 'judge',
              breakdown,
            }),
          }),
        ),
      );

      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const payload = await failed.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to submit scores.');
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
