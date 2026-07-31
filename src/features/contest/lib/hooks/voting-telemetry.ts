import { harnessLog } from '@/lib/diagnostics/harnessLog';

type BallotTarget = { contestId: string; matchupId: string };

/**
 * Submit-path telemetry. A ballot submit can race an admin closing the round,
 * so each outcome is logged distinctly — the close is a warn, not an error,
 * because it is expected behaviour rather than a fault.
 */
export const votingLog = {
  submitStart(
    target: BallotTarget,
    counts: { manualVoteCount: number; autoVoteCount: number; hasSelfVote: boolean },
  ) {
    harnessLog({ domain: 'voting', event: 'submit.start', data: { ...target, ...counts } });
  },

  submitClosed(target: BallotTarget) {
    harnessLog({ domain: 'voting', event: 'submit.closed', level: 'warn', data: { ...target } });
  },

  submitFailed(target: BallotTarget, error: string | undefined) {
    harnessLog({
      domain: 'voting',
      event: 'submit.failed',
      level: 'error',
      data: { ...target, error },
    });
  },

  submitSuccess(target: BallotTarget, totalVotes: number) {
    harnessLog({ domain: 'voting', event: 'submit.success', data: { ...target, totalVotes } });
  },
};
