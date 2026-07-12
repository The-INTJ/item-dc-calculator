'use client';

import { useEffect, useRef, useState } from 'react';
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
import { buildAutoVoteScores, buildSelfMaxVote } from '../domain/autoVote';
import { MATCHUP_CLOSED } from '../domain/errorCodes';
import { contestApi } from '../api/contestApi';
import { harnessLog } from '@/lib/diagnostics/harnessLog';

type ScoreByEntryId = Record<string, Record<string, number>>;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error' | 'closed';

/** Shown when the matchup closed while the voter had the modal open. */
export const VOTING_CLOSED_MESSAGE =
  'Voting just closed for this matchup — scores can no longer be submitted.';

/** Shown when a submit raced the close and the whole ballot was rejected. */
export const VOTING_RACE_MESSAGE =
  "You weren't quite in time — voting closed before your scores arrived, so they weren't recorded.";

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
  // Guards the async prefill below: once the user moves a slider, a
  // late-resolving fetch must not clobber their in-progress ballot.
  const hasUserEditedRef = useRef(false);

  const config = contest ? getEffectiveConfig(contest) : undefined;
  const categories = config?.attributes ?? [];
  const categoryIds = categories.map((a) => a.id);
  const entries = matchup ? getEntriesInMatchup(matchup) : [];
  const contestantsById = new Map(
    (contest?.contestants ?? []).map((c) => [c.id, c]),
  );
  const drinks = buildEntrySummaries(entries, contestantsById);
  const userId = session?.firebaseUid ?? session?.sessionId;
  const myContestantId = userId
    ? contest?.contestants.find((c) => c.userId === userId)?.id ?? null
    : null;
  const selfEntryId = myContestantId
    ? entries.find((e) => e.contestantId === myContestantId)?.id ?? null
    : null;
  const categoryKey = categoryIds.join('|');
  const entryKey = entries.map((entry) => entry.id).join('|');
  const matchupId = matchup?.id ?? null;
  // The matchup prop is re-derived from the live realtime subscription, so
  // this flips the moment an admin closes (or reopens) the matchup.
  const isMatchupOpen = matchup?.phase === 'shake';

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

    setStatus('idle');
    setMessage(null);
  }, [authLoading, categoryKey, contest?.id, entryKey, matchupId, userId]);

  // If the admin reopens a matchup while the "closed" state is showing,
  // return to a votable state. Only a closed→open TRANSITION resets — after
  // a submit races the close, the local phase can still read 'shake' for a
  // moment, and that stale openness must not wipe the "not in time" message.
  const wasOpenRef = useRef(isMatchupOpen);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isMatchupOpen;
    if (isMatchupOpen && !wasOpen && status === 'closed') {
      setStatus('idle');
      setMessage(null);
    }
  }, [isMatchupOpen, status]);

  const updateScore = (entryId: string, categoryId: string, value: number) => {
    hasUserEditedRef.current = true;
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

    // Pre-flight: the realtime subscription may already know the matchup
    // closed — skip the network round-trip entirely.
    if (matchup.phase !== 'shake') {
      setStatus('closed');
      setMessage(VOTING_CLOSED_MESSAGE);
      return;
    }

    const voteEntries = Object.entries(scores)
      .filter(([entryId]) => entryId !== selfEntryId)
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

    if (voteEntries.length === 0 && !selfEntryId) {
      setStatus('error');
      setMessage('Enter at least one score before submitting.');
      return;
    }

    const scoredIds = voteEntries.map((e) => e.entryId);
    const otherEntryIds = entries
      .map((e) => e.id)
      .filter((id) => id !== selfEntryId);
    const autoVotes = buildAutoVoteScores(otherEntryIds, scoredIds, config);
    const selfVote = buildSelfMaxVote(selfEntryId, config);
    const allVotes = [...voteEntries, ...autoVotes, ...selfVote];

    setStatus('submitting');
    setMessage(null);

    harnessLog({
      domain: 'voting',
      event: 'submit.start',
      data: {
        contestId: contest.id,
        matchupId: matchup.id,
        manualVoteCount: voteEntries.length,
        autoVoteCount: autoVotes.length,
        hasSelfVote: selfVote.length > 0,
      },
    });

    // One atomic ballot — either every entry's score lands or none do, so a
    // submit racing a round close can never leave a lopsided partial ballot.
    const result = await contestApi.submitBallot(contest.id, matchup.id, {
      userName: session?.profile.displayName ?? 'Guest',
      userRole: role ?? 'voter',
      scores: allVotes.map(({ entryId, breakdown }) => ({
        entryId,
        breakdown: breakdown as ScoreBreakdown,
      })),
    });

    if (!result.success) {
      if (result.errorCode === MATCHUP_CLOSED) {
        harnessLog({
          domain: 'voting',
          event: 'submit.closed',
          level: 'warn',
          data: { contestId: contest.id, matchupId: matchup.id },
        });
        setStatus('closed');
        setMessage(VOTING_RACE_MESSAGE);
        return;
      }

      harnessLog({
        domain: 'voting',
        event: 'submit.failed',
        level: 'error',
        data: {
          contestId: contest.id,
          matchupId: matchup.id,
          error: result.error,
        },
      });
      setStatus('error');
      setMessage(result.error ?? 'Failed to submit scores.');
      return;
    }

    harnessLog({
      domain: 'voting',
      event: 'submit.success',
      data: {
        contestId: contest.id,
        matchupId: matchup.id,
        totalVotes: allVotes.length,
      },
    });

    setStatus('success');
    setMessage('Scores submitted!');
  };

  return {
    drinks,
    categories,
    scores,
    updateScore,
    submit,
    status,
    message,
    isSubmitting: status === 'submitting',
    isMatchupOpen,
    selfEntryId,
  };
}
