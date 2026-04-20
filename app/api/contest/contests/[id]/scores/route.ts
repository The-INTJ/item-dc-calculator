import { jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../_lib/requireAuth';
import { SubmitScoreBodySchema } from '@/contest/lib/schemas';
import type { Entry, ScoreBreakdown } from '@/contest/contexts/contest/contestTypes';

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

  const entries: Entry[] = contest.entries;
  const entry = entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    return jsonError('Entry not found.', 404);
  }

  const matchupResult = await provider.matchups.getById(contest.id, matchupId);
  if (!matchupResult.success || !matchupResult.data) {
    return jsonError(matchupResult.error ?? 'Matchup not found.', 404);
  }
  const matchup = matchupResult.data;
  if (matchup.phase !== 'shake') {
    return jsonError('Matchup is not open for scoring.', 400);
  }
  if (!matchup.entryIds.includes(entryId)) {
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

  let breakdownUpdates: Partial<ScoreBreakdown> | null = null;

  if (body.breakdown && Object.keys(body.breakdown).length > 0) {
    breakdownUpdates = body.breakdown;
  } else if (body.categoryId) {
    const numericValue = Number(body.value);
    if (!Number.isFinite(numericValue)) {
      return jsonError('Score value must be numeric.', 400);
    }

    breakdownUpdates = { [body.categoryId]: numericValue };
  }

  if (!breakdownUpdates) {
    return jsonError('Score breakdown or categoryId + value is required.', 400);
  }

  const submitResult = await provider.scores.submit(contest.id, {
    entryId,
    userId,
    matchupId,
    breakdown: breakdownUpdates as ScoreBreakdown,
    ...(body.notes ? { notes: body.notes } : {}),
  });

  if (!submitResult.success || !submitResult.data) {
    const message = submitResult.error ?? 'Failed to submit score';
    const status = message.startsWith('Validation:') ? 400 : 500;
    return jsonError(message, status);
  }

  return jsonSuccess(submitResult.data);
}
