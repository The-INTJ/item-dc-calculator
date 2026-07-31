'use client';

import { useState } from 'react';
import type { Contest, Matchup, ScoreBreakdown, UserRole } from '../../contexts/contest/contestTypes';
import type { BallotSubject } from './ballot-subject';
import { assembleBallot } from './ballotAssembly';
import { MATCHUP_CLOSED } from '../domain/errorCodes';
import { contestApi } from '../api/contestApi';
import { votingLog } from './voting-telemetry';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error' | 'closed';

/** Shown when the matchup closed while the voter had the modal open. */
export const VOTING_CLOSED_MESSAGE =
  'Voting just closed for this matchup — scores can no longer be submitted.';

/** Shown when a submit raced the close and the whole ballot was rejected. */
export const VOTING_RACE_MESSAGE =
  "You weren't quite in time — voting closed before your scores arrived, so they weren't recorded.";

interface BallotSubmissionArgs {
  contest: Contest | null;
  matchup: Matchup | null;
  subject: BallotSubject;
  scores: Record<string, Record<string, number>>;
  userId: string | undefined;
  userName: string;
  userRole: UserRole;
}

/** Sending the ballot, and the status that submit produces. */
export function useBallotSubmission({
  contest,
  matchup,
  subject,
  scores,
  userId,
  userName,
  userRole,
}: BallotSubmissionArgs) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  function resetStatus() {
    setStatus('idle');
    setMessage(null);
  }

  function fail(text: string) {
    setStatus('error');
    setMessage(text);
  }

  const submit = async () => {
    const { config, categoryIds, entries, selfEntryId } = subject;
    if (!contest?.id || !matchup?.id || !userId || !config) {
      fail('No active matchup or session.');
      return;
    }

    // Pre-flight: the realtime subscription may already know the matchup
    // closed — skip the network round-trip entirely.
    if (matchup.phase !== 'shake') {
      setStatus('closed');
      setMessage(VOTING_CLOSED_MESSAGE);
      return;
    }

    const { voteEntries, autoVotes, selfVote, allVotes } = assembleBallot({
      scores,
      entryIds: entries.map((e) => e.id),
      categoryIds,
      selfEntryId,
      config,
    });

    if (voteEntries.length === 0 && !selfEntryId) {
      fail('Enter at least one score before submitting.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    const target = { contestId: contest.id, matchupId: matchup.id };
    votingLog.submitStart(target, {
      manualVoteCount: voteEntries.length,
      autoVoteCount: autoVotes.length,
      hasSelfVote: selfVote.length > 0,
    });

    // One atomic ballot — either every entry's score lands or none do, so a
    // submit racing a round close can never leave a lopsided partial ballot.
    const result = await contestApi.submitBallot(contest.id, matchup.id, {
      userName,
      userRole,
      scores: allVotes.map(({ entryId, breakdown }) => ({
        entryId,
        breakdown: breakdown as ScoreBreakdown,
      })),
    });

    if (!result.success) {
      if (result.errorCode === MATCHUP_CLOSED) {
        votingLog.submitClosed(target);
        setStatus('closed');
        setMessage(VOTING_RACE_MESSAGE);
        return;
      }

      votingLog.submitFailed(target, result.error);
      fail(result.error ?? 'Failed to submit scores.');
      return;
    }

    votingLog.submitSuccess(target, allVotes.length);
    setStatus('success');
    setMessage('Scores submitted!');
  };

  return { status, message, submit, resetStatus };
}
