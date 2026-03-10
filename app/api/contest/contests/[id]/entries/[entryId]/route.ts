import { fromProviderResult, jsonError, jsonSuccess, readJsonBody } from '../../../../_lib/http';
import { getContestByParam } from '../../../../_lib/provider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import type { Entry } from '@/contest/contexts/contest/contestTypes';

interface RouteParams {
  params: Promise<{ id: string; entryId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestParam, entryId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.entries.getById(contest.id, entryId);
  if (!result.success || !result.data) {
    return jsonError(result.error ?? 'Entry not found', 404);
  }

  return jsonSuccess(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestParam, entryId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await readJsonBody<Partial<Entry>>(request);
  if (!body.ok) {
    return body.response;
  }

  const result = await provider.entries.update(contest.id, entryId, body.data);
  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestParam, entryId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.entries.delete(contest.id, entryId);
  if (!result.success) {
    return jsonError(result.error ?? 'Entry not found', 404);
  }

  return jsonSuccess({ success: true });
}
