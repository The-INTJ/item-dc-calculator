'use client';

import { useState } from 'react';
import { useAuth } from '@/src/mixology/auth';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import {
  breakdownKeys,
  buildFullBreakdown,
  calculateScore,
  isBreakdownKey,
} from '@/src/mixology/utils/scoreUtils';
import type { ScoreBreakdown } from '@/src/mixology/types';
import type { ScoreByDrinkId } from './useVoteScores';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseSubmitVotesResult {
  /** Current submission status */
  status: SubmitStatus;
  /** Status message (success or error description) */
  message: string | null;
  /** Submit all current scores */
  submitScores: (scores: ScoreByDrinkId) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting: boolean;
}

/**
 * Custom hook that handles vote submission to the backend.
 * Manages submission state and syncs with local session storage.
 */
export function useSubmitVotes(): UseSubmitVotesResult {
  const { session, role, recordVote } = useAuth();
  const { contest, refreshAll } = useMixologyData();

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const judgeId = session?.firebaseUid ?? session?.sessionId;

  const categoryIds = (contest?.categories ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((cat) => cat.id);

  const submitScores = async (scores: ScoreByDrinkId) => {
    if (!contest?.id || !judgeId) {
      setStatus('error');
      setMessage('No active contest or session.');
      return;
    }

    // Build entries from the score map
    const entries = Object.entries(scores)
      .map(([drinkId, drinkScores]) => {
        const breakdown = categoryIds.reduce<Partial<ScoreBreakdown>>((acc, categoryId) => {
          if (!isBreakdownKey(categoryId)) return acc;
          const value = drinkScores?.[categoryId];
          if (!Number.isFinite(value)) return acc;
          acc[categoryId] = value;
          return acc;
        }, {});
        return { drinkId, breakdown };
      })
      .filter((entry) => Object.keys(entry.breakdown).length > 0);

    if (entries.length === 0) {
      setStatus('error');
      setMessage('Enter at least one score before submitting.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const responses = await Promise.all(
        entries.map(({ drinkId, breakdown }) =>
          fetch(`/api/mixology/contests/${contest.id}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              drinkId,
              judgeId,
              judgeName: session?.profile.displayName ?? 'Guest',
              judgeRole: role ?? 'judge',
              breakdown,
            }),
          })
        )
      );

      const failed = responses.find((res) => !res.ok);
      if (failed) {
        const payload = await failed.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to submit scores.');
      }

      // Sync to local session
      for (const entry of entries) {
        const fullBreakdown = buildFullBreakdown(entry.breakdown);
        await recordVote({
          contestId: contest.id,
          drinkId: entry.drinkId,
          breakdown: fullBreakdown,
          score: calculateScore(fullBreakdown),
        });
      }

      setStatus('success');
      setMessage('Scores submitted successfully.');
      await refreshAll();
    } catch (submitError) {
      setStatus('error');
      setMessage(String(submitError));
    }
  };

  return {
    status,
    message,
    submitScores,
    isSubmitting: status === 'submitting',
  };
}
