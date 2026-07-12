import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateMatchupBodySchema } from '@/contest/lib/schemas';
import { resolveMatchupWinner } from '@/contest/lib/domain/winnerResolution';

interface RouteParams {
  params: Promise<{ id: string; matchupId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id, matchupId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.matchups.getById(contest.id, matchupId);
  if (!result.success || !result.data) {
    return jsonError(result.error ?? 'Matchup not found', 404);
  }

  return jsonSuccess(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, matchupId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, UpdateMatchupBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const updates = { ...body.data };

  // Closing a matchup persists the winner at close time: when no explicit
  // winner is supplied and none is recorded, derive one from the current
  // score aggregates. Ties stay winnerless (admin resolves; seed backstops).
  if (updates.phase === 'scored' && updates.winnerEntryId === undefined) {
    const existing = await provider.matchups.getById(contest.id, matchupId);
    if (existing.success && existing.data && !existing.data.winnerEntryId) {
      const resolution = resolveMatchupWinner(existing.data);
      if (resolution.ok) {
        updates.winnerEntryId = resolution.winnerEntryId;
      }
    }
  }

  const result = await provider.matchups.update(contest.id, matchupId, updates);
  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, matchupId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.matchups.delete(contest.id, matchupId);
  if (!result.success) {
    return jsonError(result.error ?? 'Matchup not found', 404);
  }

  return new NextResponse(null, { status: 204 });
}
