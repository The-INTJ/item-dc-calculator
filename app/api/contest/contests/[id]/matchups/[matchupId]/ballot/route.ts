import { jsonError, jsonSuccess, parseBody } from '../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../../../_lib/requireAuth';
import { SubmitBallotBodySchema } from '@/contest/lib/schemas';
import { MATCHUP_CLOSED, SCORE_INVALID } from '@/contest/lib/domain/errorCodes';
import { validateBallotScores } from './ballot-scores';
import { ballotLog } from './ballot-telemetry';

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
  const target = { contestId: contest.id, matchupId, userId };

  const matchupResult = await provider.matchups.getById(contest.id, matchupId);
  if (!matchupResult.success || !matchupResult.data) {
    return jsonError(matchupResult.error ?? 'Matchup not found.', 404);
  }
  const matchup = matchupResult.data;
  if (matchup.phase !== 'shake') {
    ballotLog.phaseGuardRejected(target, matchup.phase);
    return jsonError('Matchup is not open for scoring.', 409, MATCHUP_CLOSED);
  }

  const entryIds = new Set(matchup.entries.map((e) => e.id));
  for (const score of body.scores) {
    if (!entryIds.has(score.entryId)) {
      return jsonError('Entry is not part of this matchup.', 400);
    }
  }

  const validation = await validateBallotScores({
    provider,
    contest,
    matchupId,
    userId,
    scores: body.scores,
  });
  if ('failures' in validation) {
    ballotLog.validationRejected(target, validation.failures);
    return jsonError(validation.failures.join(' '), 400, SCORE_INVALID);
  }
  const validatedScores = validation.scores;

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
      ballotLog.raceRejected(target);
      return jsonError('Matchup is not open for scoring.', 409, MATCHUP_CLOSED);
    }
    return jsonError(message, 500);
  }

  ballotLog.submitted(target, validatedScores.length);
  return jsonSuccess({ scores: submitResult.data });
}
