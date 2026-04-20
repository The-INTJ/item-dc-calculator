import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateMatchupBodySchema } from '@/contest/lib/schemas';

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

  const result = await provider.matchups.update(contest.id, matchupId, body.data);
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
