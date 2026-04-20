'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import { getEffectiveConfig } from '../domain/validation';
import { getEntriesInMatchup } from '../domain/matchupGetters';
import {
  buildScoreDefaults,
  buildScoresFromEntries,
  isBreakdownKey,
  mergeScoreMaps,
} from '../domain/scoreUtils';
import { buildEntrySummaries } from '../presentation/uiMappings';
import type {
  Contest,
  Matchup,
  ScoreBreakdown,
  ScoreEntry,
} from '../../contexts/contest/contestTypes';
import { buildAutoVoteScores } from '../domain/autoVote';
import { contestApi } from '../api/contestApi';

type ScoreByEntryId = Record<string, Record<string, number>>;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Self-contained hook for voting on the entries in a single matchup. Manages
 * local score state, submission to the API (with `matchupId` attached), and
 * status tracking. Pre-fills scores from the user's existing votes for this
 * matchup when available.
 */
export function useMatchupVoting(contest: Contest | null, matchup: Matchup | null) {
  const { session, role, loading: authLoading } = useAuth();
  const [scores, setScores] = useState<ScoreByEntryId>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const config = contest ? getEffectiveConfig(contest) : undefined;
  const categories = config?.attributes ?? [];
  const categoryIds = categories.map((a) => a.id);
  const entries = contest && matchup ? getEntriesInMatchup(matchup, contest) : [];
  const drinks = buildEntrySummaries(entries);
  const userId = session?.firebaseUid ?? session?.sessionId;
  const categoryKey = categoryIds.join('|');
  const entryKey = entries.map((entry) => entry.id).join('|');
  const matchupId = matchup?.id ?? null;

  useEffect(() => {
    if (authLoading) return;

    const entryIds = entries.map((e) => e.id);
    if (entryIds.length === 0 || categoryIds.length === 0) {
      setScores({});
      return;
    }

    const defaults = buildScoreDefaults(entryIds, categoryIds);

    if (contest?.id && userId) {
      contestApi.getScoresForUser(contest.id, userId)
        .then((result) => {
          const userScores: ScoreEntry[] = result.success ? result.data ?? [] : [];
          if (!userScores.length) {
            setScores(defaults);
            return;
          }

          const matchupEntryIds = new Set(entryIds);
          const matchupScores = userScores.filter(
            (s) => matchupEntryIds.has(s.entryId) && (!matchupId || s.matchupId === matchupId || !s.matchupId),
          );
          const existing = buildScoresFromEntries(matchupScores, categoryIds, config);
          setScores(mergeScoreMaps(defaults, existing));
        })
        .catch(() => setScores(defaults));
    } else {
      setScores(defaults);
    }

    setStatus('idle');
    setMessage(null);
  }, [authLoading, categoryKey, contest?.id, entryKey, matchupId, userId]);

  const updateScore = (entryId: string, categoryId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [entryId]: { ...(prev[entryId] ?? {}), [categoryId]: value },
    }));
  };

  const submit = async () => {
    if (!contest?.id || !matchup?.id || !userId || !config) {
      setStatus('error');
      setMessage('No active matchup or session.');
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

    const scoredIds = voteEntries.map((e) => e.entryId);
    const allEntryIds = entries.map((e) => e.id);
    const autoVotes = buildAutoVoteScores(allEntryIds, scoredIds, config);
    const allVotes = [...voteEntries, ...autoVotes];

    setStatus('submitting');
    setMessage(null);

    try {
      const results = await Promise.all(
        allVotes.map(({ entryId, breakdown }) =>
          contestApi.submitScore(contest.id, {
            entryId,
            matchupId: matchup.id,
            userName: session?.profile.displayName ?? 'Guest',
            userRole: role ?? 'voter',
            breakdown,
          }),
        ),
      );

      const firstFailure = results.find((r) => !r.success);
      if (firstFailure) throw new Error(firstFailure.error ?? 'Failed to submit scores.');

      setStatus('success');
      setMessage('Scores submitted!');
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  };

  return { drinks, categories, scores, updateScore, submit, status, message, isSubmitting: status === 'submitting' };
}
