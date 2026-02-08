'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { useActiveContest } from '../../contexts/ActiveContestContext';
import {
  buildFullBreakdown,
  calculateScore,
  isBreakdownKey,
} from '../helpers/scoreUtils';
import type { ScoreBreakdown } from '../../contexts/contest/contestTypes';
import { getEffectiveConfig } from '../helpers/validation';
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
  const { session, role } = useAuth();
  const { recordVote } = useContestStore();
  const { contest, refreshAll } = useActiveContest();

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const judgeId = session?.firebaseUid ?? session?.sessionId;

  // Get config-based category IDs
  const config = contest ? getEffectiveConfig(contest) : undefined;
  const categoryIds = config
    ? config.attributes.map((attr) => attr.id)
    : [];

  const submitScores = async (scores: ScoreByDrinkId) => {
    if (!contest?.id || !judgeId || !config) {
      setStatus('error');
      setMessage('No active contest or session.');
      return;
    }

    // Build entries from the score map
    const entries = Object.entries(scores)
      .map(([entryId, entryScores]) => {
        const breakdown = categoryIds.reduce<Partial<ScoreBreakdown>>((acc, categoryId) => {
          if (!isBreakdownKey(categoryId, config)) return acc;
          const value = entryScores?.[categoryId];
          if (!Number.isFinite(value)) return acc;
          acc[categoryId] = value;
          return acc;
        }, {});
        return { entryId, breakdown };
      })
      .filter((entry) => Object.keys(entry.breakdown).length > 0);

    if (entries?.length === 0) {
      setStatus('error');
      setMessage('Enter at least one score before submitting.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const responses = await Promise.all(
        entries?.map(({ entryId, breakdown }) =>
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
        const fullBreakdown = buildFullBreakdown(entry.breakdown, config);
        await recordVote({
          contestId: contest.id,
          entryId: entry.entryId,
          breakdown: fullBreakdown,
          score: calculateScore(fullBreakdown, config),
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
