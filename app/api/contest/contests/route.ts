import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../_lib/requireAdmin';
import { CreateContestBodySchema } from '@/contest/lib/schemas';

export async function GET(request: Request) {
  const provider = await loadProvider();
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (slug) {
    const result = await provider.contests.getBySlug(slug);
    if (!result.success || !result.data) {
      return jsonError(result.error ?? 'Contest not found', 404);
    }
    return jsonSuccess(result.data);
  }

  const [contestsResult, defaultResult] = await Promise.all([
    provider.contests.list(),
    provider.contests.getDefault(),
  ]);

  if (!contestsResult.success) {
    return jsonError(contestsResult.error ?? 'Failed to load contests', 500);
  }

  if (!defaultResult.success) {
    return jsonError(defaultResult.error ?? 'Failed to load current contest', 500);
  }

  return jsonSuccess({
    contests: contestsResult.data ?? [],
    currentContest: defaultResult.data ?? null,
  });
}

export async function POST(request: Request) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const body = await parseBody(request, CreateContestBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const provider = await loadProvider();
  const result = await provider.contests.create(body.data);

  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
