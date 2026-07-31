import { harnessLog } from '@/lib/diagnostics/harnessLog';

type BallotTarget = { contestId: string; matchupId: string; userId: string };

/**
 * The voting events this route emits. Both rejection paths are warnings, not
 * errors: a ballot arriving after the round closes is ordinary contest timing,
 * and the two are logged distinctly so a race (rejected inside the
 * transaction) is tellable from a plain late submit (rejected by the
 * pre-check).
 */
export const ballotLog = {
  phaseGuardRejected(target: BallotTarget, currentPhase: string) {
    harnessLog({
      domain: 'voting',
      event: 'phase.guard.rejected',
      level: 'warn',
      data: { ...target, currentPhase },
    });
  },

  validationRejected(target: BallotTarget, failures: string[]) {
    harnessLog({
      domain: 'voting',
      event: 'validation.rejected',
      level: 'warn',
      data: { ...target, failures },
    });
  },

  raceRejected(target: BallotTarget) {
    harnessLog({ domain: 'voting', event: 'ballot.raceRejected', level: 'warn', data: { ...target } });
  },

  submitted(target: BallotTarget, scoreCount: number) {
    harnessLog({ domain: 'voting', event: 'ballot.submitted', data: { ...target, scoreCount } });
  },
};
