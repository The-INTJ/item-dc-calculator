import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { CreateEntryBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: contestParam } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const result = await provider.entries.listByContest(contest.id);
  if (!result.success) {
    return jsonError(result.error ?? 'Entries not found', 404);
  }

  return jsonSuccess(result.data ?? []);
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestParam } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, CreateEntryBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await provider.entries.create(contest.id, body.data);
  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
