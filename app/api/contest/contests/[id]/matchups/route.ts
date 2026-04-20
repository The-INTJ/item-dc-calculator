import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { CreateMatchupBodySchema } from '@/contest/lib/schemas';
import type { MatchupCreateInput } from '@/contest/lib/backend/types';

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
  const roundId = url.searchParams.get('roundId');

  const result = roundId
    ? await provider.matchups.listByRound(contest.id, roundId)
    : await provider.matchups.listByContest(contest.id);

  if (!result.success) {
    return jsonError(result.error ?? 'Matchups not found', 404);
  }

  return jsonSuccess({ matchups: result.data ?? [] });
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, CreateMatchupBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const input: MatchupCreateInput = {
    roundId: body.data.roundId,
    slotIndex: body.data.slotIndex,
    entryIds: body.data.entryIds ?? [],
    phase: body.data.phase ?? 'set',
    ...(body.data.winnerEntryId !== undefined ? { winnerEntryId: body.data.winnerEntryId } : {}),
    ...(body.data.advancesToMatchupId !== undefined
      ? { advancesToMatchupId: body.data.advancesToMatchupId }
      : {}),
    ...(body.data.advancesToSlot !== undefined ? { advancesToSlot: body.data.advancesToSlot } : {}),
  };

  const result = await provider.matchups.create(contest.id, input);
  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
