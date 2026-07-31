import type { BackendProvider } from '@/contest/lib/backend/types';
import type { Contest, ScoreBreakdown } from '@/contest/contexts/contest/contestTypes';
import { normalizeScorePayload } from '@/contest/lib/domain/scoreNormalization';
import { makeVoteDocId } from '@/contest/lib/firebase/scoreHelpers';

interface ScoreBody {
  breakdown?: Partial<ScoreBreakdown>;
  categoryId?: string;
  value?: unknown;
}

/**
 * A score arrives either as a whole breakdown or as a single category+value
 * pair, and both mean the same thing downstream. Neither present is a bad
 * request rather than an empty score.
 */
export function resolveBreakdownUpdates(
  body: ScoreBody,
): { breakdown: Partial<ScoreBreakdown> } | { error: string } {
  if (body.breakdown && Object.keys(body.breakdown).length > 0) {
    return { breakdown: body.breakdown };
  }

  if (body.categoryId) {
    const numericValue = Number(body.value);
    if (!Number.isFinite(numericValue)) {
      return { error: 'Score value must be numeric.' };
    }
    return { breakdown: { [body.categoryId]: numericValue } };
  }

  return { error: 'Score breakdown or categoryId + value is required.' };
}

interface NormalizeArgs {
  provider: BackendProvider;
  contest: Contest;
  matchupId: string;
  entryId: string;
  userId: string;
  updates: Partial<ScoreBreakdown>;
}

/**
 * Validate + normalize against the contest config (attribute set, min/max).
 * Partial updates merge onto the caller's existing vote for this entry.
 * Configless contests skip validation — there is nothing to validate against.
 */
export async function normalizeAgainstConfig({
  provider,
  contest,
  matchupId,
  entryId,
  userId,
  updates,
}: NormalizeArgs): Promise<{ breakdown: ScoreBreakdown } | { error: string }> {
  if (!contest.config) {
    return { breakdown: updates as ScoreBreakdown };
  }

  const existingVote = await provider.scores.getById(
    contest.id,
    makeVoteDocId(userId, matchupId, entryId),
  );
  try {
    const normalized = normalizeScorePayload({
      contest,
      baseBreakdown: existingVote.success ? existingVote.data?.breakdown : undefined,
      updates,
    });
    return { breakdown: normalized.breakdown };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Score breakdown is invalid.' };
  }
}
