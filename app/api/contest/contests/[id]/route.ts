import { fromProviderResult, jsonError, jsonSuccess, readJsonBody } from '../../_lib/http';
import { getContestByParam } from '../../_lib/provider';
import { requireAdmin } from '../../_lib/requireAdmin';
import type { Contest } from '@/contest/contexts/contest/contestTypes';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  return jsonSuccess(contest);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await readJsonBody<Partial<Contest>>(request);
  if (!body.ok) {
    return body.response;
  }

  const result = await provider.contests.update(contest.id, body.data);
  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.contests.delete(contest.id);
  if (!result.success) {
    return jsonError(result.error ?? 'Contest not found', 404);
  }

  return jsonSuccess({ success: true });
}
