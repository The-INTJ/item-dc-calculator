import { fromProviderResult, jsonError, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateRoundBodySchema } from '@/contest/lib/schemas';
import type { ContestRound } from '@/contest/contexts/contest/contestTypes';

interface RouteParams {
  params: Promise<{ id: string; roundId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, roundId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, UpdateRoundBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const rounds: ContestRound[] = contest.rounds ?? [];
  const idx = rounds.findIndex((round) => round.id === roundId);
  if (idx === -1) {
    return jsonError('Round not found', 404);
  }

  const nextRound: ContestRound = {
    ...rounds[idx],
    ...(body.data.name !== undefined ? { name: body.data.name } : {}),
    ...(body.data.number !== undefined ? { number: body.data.number } : {}),
    ...(body.data.adminOverride !== undefined
      ? { adminOverride: body.data.adminOverride }
      : {}),
  };

  const nextRounds = [...rounds];
  nextRounds[idx] = nextRound;

  const result = await provider.contests.update(contest.id, { rounds: nextRounds });
  return fromProviderResult(result, { failureStatus: 404 });
}
