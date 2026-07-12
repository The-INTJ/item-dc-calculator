import { jsonError, jsonSuccess, parseBody } from '../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../../../_lib/requireAuth';
import { SubmitBallotBodySchema } from '@/contest/lib/schemas';
import type { ScoreBreakdown } from '@/contest/contexts/contest/contestTypes';
import type { BallotScoreInput } from '@/contest/lib/backend/types';
import { MATCHUP_CLOSED, SCORE_INVALID } from '@/contest/lib/domain/errorCodes';
import { normalizeScorePayload } from '@/contest/lib/domain/scoreNormalization';
import { makeVoteDocId } from '@/contest/lib/firebase/scoreHelpers';
import { harnessLog } from '@/lib/diagnostics/harnessLog';

interface RouteParams {
  params: Promise<{ id: string; matchupId: string }>;
}

/**
 * Atomic ballot submission: a voter's scores for every entry in a matchup,
 * committed in one transaction. The matchup phase is re-checked inside the
 * transaction, so a ballot racing a round close either fully lands or is
 * fully rejected with MATCHUP_CLOSED — never a lopsided partial ballot.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { id, matchupId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const bodyResult = await parseBody(request, SubmitBallotBodySchema);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.data;
  const userId = auth.user.uid;

  const matchupResult = await provider.matchups.getById(contest.id, matchupId);
  if (!matchupResult.success || !matchupResult.data) {
    return jsonError(matchupResult.error ?? 'Matchup not found.', 404);
  }
  const matchup = matchupResult.data;
  if (matchup.phase !== 'shake') {
    harnessLog({
      domain: 'voting',
      event: 'phase.guard.rejected',
      level: 'warn',
      data: { contestId: contest.id, matchupId, currentPhase: matchup.phase, userId },
    });
    return jsonError('Matchup is not open for scoring.', 409, MATCHUP_CLOSED);
  }

  const entryIds = new Set(matchup.entries.map((e) => e.id));
  for (const score of body.scores) {
    if (!entryIds.has(score.entryId)) {
      return jsonError('Entry is not part of this matchup.', 400);
    }
  }

  // Validate every breakdown before opening the transaction; partial updates
  // merge onto the caller's existing vote for that entry.
  const validatedScores: BallotScoreInput[] = [];
  if (contest.config) {
    const failures: string[] = [];
    for (const score of body.scores) {
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
        validatedScores.push({ entryId: score.entryId, breakdown: normalized.breakdown });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Score breakdown is invalid.';
        failures.push(`${score.entryId}: ${message}`);
      }
    }
    if (failures.length > 0) {
      harnessLog({
        domain: 'voting',
        event: 'validation.rejected',
        level: 'warn',
        data: { contestId: contest.id, matchupId, userId, failures },
      });
      return jsonError(failures.join(' '), 400, SCORE_INVALID);
    }
  } else {
    validatedScores.push(
      ...body.scores.map((s) => ({ entryId: s.entryId, breakdown: s.breakdown as ScoreBreakdown })),
    );
  }

  const voters = contest.voters ?? [];
  if (!voters.some((voter) => voter.id === userId)) {
    await provider.voters.create(contest.id, {
      id: userId,
      displayName: body.userName?.trim() || auth.user.displayName || 'Guest',
      role: body.userRole ?? auth.user.role ?? 'voter',
    });
  }

  const submitResult = await provider.scores.submitBallot(contest.id, {
    matchupId,
    userId,
    scores: validatedScores,
  });

  if (!submitResult.success || !submitResult.data) {
    const message = submitResult.error ?? 'Failed to submit ballot';
    if (/not open for scoring/i.test(message)) {
      // The phase flipped between the pre-check and the transaction — the
      // in-transaction guard rejected the whole ballot.
      harnessLog({
        domain: 'voting',
        event: 'ballot.raceRejected',
        level: 'warn',
        data: { contestId: contest.id, matchupId, userId },
      });
      return jsonError('Matchup is not open for scoring.', 409, MATCHUP_CLOSED);
    }
    return jsonError(message, 500);
  }

  harnessLog({
    domain: 'voting',
    event: 'ballot.submitted',
    data: { contestId: contest.id, matchupId, userId, scoreCount: validatedScores.length },
  });
  return jsonSuccess({ scores: submitResult.data });
}
