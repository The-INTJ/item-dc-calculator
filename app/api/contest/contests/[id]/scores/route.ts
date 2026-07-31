import { jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../_lib/requireAuth';
import { SubmitScoreBodySchema } from '@/contest/lib/schemas';
import { MATCHUP_CLOSED, SCORE_INVALID } from '@/contest/lib/domain/errorCodes';
import { harnessLog } from '@/lib/diagnostics/harnessLog';
import { normalizeAgainstConfig, resolveBreakdownUpdates } from './score-submission';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const url = new URL(request.url);
  const entryId = url.searchParams.get('entryId');
  const userId = url.searchParams.get('userId');

  if (entryId) {
    const result = await provider.scores.listByEntry(contest.id, entryId);
    if (!result.success || !result.data) {
      return jsonError(result.error ?? 'Scores not found', 404);
    }

    const filtered = userId ? result.data.filter((score) => score.userId === userId) : result.data;
    return jsonSuccess({ scores: filtered });
  }

  if (userId) {
    const result = await provider.scores.listByUser(contest.id, userId);
    if (!result.success || !result.data) {
      return jsonError(result.error ?? 'Scores not found', 404);
    }

    return jsonSuccess({ scores: result.data });
  }

  return jsonSuccess({ scores: [] });
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const bodyResult = await parseBody(request, SubmitScoreBodySchema);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.data;
  const entryId = body.entryId.trim();
  const matchupId = body.matchupId.trim();
  const userId = auth.user.uid;

  if (!entryId) return jsonError('entryId is required.', 400);
  if (!matchupId) return jsonError('matchupId is required.', 400);

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
  if (!matchup.entries.some((e) => e.id === entryId)) {
    return jsonError('Entry is not part of this matchup.', 400);
  }

  const voters = contest.voters ?? [];
  if (!voters.some((voter) => voter.id === userId)) {
    await provider.voters.create(contest.id, {
      id: userId,
      displayName: body.userName?.trim() || auth.user.displayName || 'Guest',
      role: body.userRole ?? auth.user.role ?? 'voter',
    });
  }

  const updates = resolveBreakdownUpdates(body);
  if ('error' in updates) {
    return jsonError(updates.error, 400);
  }

  const normalized = await normalizeAgainstConfig({
    provider,
    contest,
    matchupId,
    entryId,
    userId,
    updates: updates.breakdown,
  });
  if ('error' in normalized) {
    harnessLog({
      domain: 'voting',
      event: 'validation.rejected',
      level: 'warn',
      data: { contestId: contest.id, matchupId, entryId, userId, message: normalized.error },
    });
    return jsonError(normalized.error, 400, SCORE_INVALID);
  }

  const submitResult = await provider.scores.submit(contest.id, {
    entryId,
    userId,
    matchupId,
    breakdown: normalized.breakdown,
    ...(body.notes ? { notes: body.notes } : {}),
  });

  if (!submitResult.success || !submitResult.data) {
    const message = submitResult.error ?? 'Failed to submit score';
    const status = message.startsWith('Validation:') ? 400 : 500;
    return jsonError(message, status);
  }

  return jsonSuccess(submitResult.data);
}
