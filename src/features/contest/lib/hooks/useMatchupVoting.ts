'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { deriveBallotSubject } from './ballot-subject';
import { useBallotPrefill } from './useBallotPrefill';
import { useBallotSubmission } from './useBallotSubmission';

export type { SubmitStatus } from './useBallotSubmission';
export { VOTING_CLOSED_MESSAGE, VOTING_RACE_MESSAGE } from './useBallotSubmission';

type ScoreByEntryId = Record<string, Record<string, number>>;

/**
 * Self-contained hook for voting on the entries in a single matchup. Manages
 * local score state, submission to the API (with `matchupId` attached), and
 * status tracking. Pre-fills scores from the user's existing votes for this
 * matchup when available.
 */
export function useMatchupVoting(contest: Contest | null, matchup: Matchup | null) {
  const { session, role, loading: authLoading } = useAuth();
  const [scores, setScores] = useState<ScoreByEntryId>({});
  // Guards the async prefill: once the user moves a slider, a late-resolving
  // fetch must not clobber their in-progress ballot.
  const hasUserEditedRef = useRef(false);

  const userId = session?.firebaseUid ?? session?.sessionId;
  const subject = deriveBallotSubject(contest, matchup, userId);
  const { isMatchupOpen } = subject;

  const { status, message, submit, resetStatus } = useBallotSubmission({
    contest,
    matchup,
    subject,
    scores,
    userId,
    userName: session?.profile.displayName ?? 'Guest',
    userRole: role ?? 'voter',
  });

  useBallotPrefill({
    contest,
    subject,
    userId,
    authLoading,
    setScores,
    hasUserEditedRef,
    onReset: resetStatus,
  });

  // If the admin reopens a matchup while the "closed" state is showing,
  // return to a votable state. Only a closed→open TRANSITION resets — after
  // a submit races the close, the local phase can still read 'shake' for a
  // moment, and that stale openness must not wipe the "not in time" message.
  const wasOpenRef = useRef(isMatchupOpen);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isMatchupOpen;
    if (isMatchupOpen && !wasOpen && status === 'closed') {
      resetStatus();
    }
  }, [isMatchupOpen, status]);

  const updateScore = (entryId: string, categoryId: string, value: number) => {
    hasUserEditedRef.current = true;
    setScores((prev) => ({
      ...prev,
      [entryId]: { ...(prev[entryId] ?? {}), [categoryId]: value },
    }));
  };

  return {
    drinks: subject.drinks,
    categories: subject.categories,
    scores,
    updateScore,
    submit,
    status,
    message,
    isSubmitting: status === 'submitting',
    isMatchupOpen,
    selfEntryId: subject.selfEntryId,
  };
}
