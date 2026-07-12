import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateContestantBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string; contestantId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestParam, contestantId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.contestants.getById(contest.id, contestantId);
  if (!result.success || !result.data) {
    return jsonError(result.error ?? 'Contestant not found', 404);
  }

  return jsonSuccess(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestParam, contestantId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, UpdateContestantBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await provider.contestants.update(contest.id, contestantId, body.data);
  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestParam, contestantId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  // Cascade semantics: removes their matchup entries (2-entry matchups
  // collapse to a scored bye), recomputes winners, purges votes on their
  // entries. Votes they cast on other entries and their Voter record remain.
  const result = await provider.contestants.removeCascade(contest.id, contestantId);
  if (!result.success) {
    return jsonError(result.error ?? 'Contestant not found', 404);
  }

  return new NextResponse(null, { status: 204 });
}
