import type { BackendProvider, BallotScoreInput } from '@/contest/lib/backend/types';
import type { Contest, ScoreBreakdown } from '@/contest/contexts/contest/contestTypes';
import { normalizeScorePayload } from '@/contest/lib/domain/scoreNormalization';
import { makeVoteDocId } from '@/contest/lib/firebase/scoreHelpers';

interface SubmittedScore {
  entryId: string;
  breakdown: Partial<ScoreBreakdown>;
}

interface ValidateArgs {
  provider: BackendProvider;
  contest: Contest;
  matchupId: string;
  userId: string;
  scores: SubmittedScore[];
}

type ValidationOutcome = { scores: BallotScoreInput[] } | { failures: string[] };

/**
 * Validate every breakdown before the transaction opens, so a bad score fails
 * the request rather than half-writing a ballot. A partial breakdown merges
 * onto whatever the voter already submitted for that entry, which is why each
 * one needs its existing vote read first.
 *
 * A contest with no config takes breakdowns as given — there is nothing to
 * validate them against.
 */
export async function validateBallotScores({
  provider,
  contest,
  matchupId,
  userId,
  scores,
}: ValidateArgs): Promise<ValidationOutcome> {
  if (!contest.config) {
    return {
      scores: scores.map((s) => ({ entryId: s.entryId, breakdown: s.breakdown as ScoreBreakdown })),
    };
  }

  const validated: BallotScoreInput[] = [];
  const failures: string[] = [];

  for (const score of scores) {
    const existingVote = await provider.scores.getById(
      contest.id,
      makeVoteDocId(userId, matchupId, score.entryId),
    );
    try {
      const normalized = normalizeScorePayload({
        contest,
        baseBreakdown: existingVote.success ? existingVote.data?.breakdown : undefined,
        updates: score.breakdown,
      });
      validated.push({ entryId: score.entryId, breakdown: normalized.breakdown });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Score breakdown is invalid.';
      failures.push(`${score.entryId}: ${message}`);
    }
  }

  return failures.length > 0 ? { failures } : { scores: validated };
}
