import { jsonError, jsonSuccess, readJsonBody } from '../../../_lib/http';
import { getContestByParam } from '../../../_lib/provider';
import type { Entry, ScoreBreakdown, UserRole } from '@/contest/contexts/contest/contestTypes';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ScoreSubmitBody {
  entryId?: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  categoryId?: string;
  value?: number;
  breakdown?: Partial<ScoreBreakdown>;
  round?: string;
  notes?: string;
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
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const bodyResult = await readJsonBody<ScoreSubmitBody>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.data;
  const entryId = body.entryId?.trim();
  const userId = body.userId?.trim();

  if (!entryId || !userId) {
    return jsonError('entryId and userId are required.', 400);
  }

  const entries: Entry[] = contest.entries;
  const entry = entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    return jsonError('Entry not found.', 404);
  }

  const voters = contest.voters ?? [];
  if (!voters.some((voter) => voter.id === userId)) {
    await provider.voters.create(contest.id, {
      id: userId,
      displayName: body.userName?.trim() || 'Guest',
      role: body.userRole ?? 'voter',
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

  const round = body.round?.trim() || entry.round || '';
  const submitResult = await provider.scores.submit(contest.id, {
    entryId,
    userId,
    round,
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
