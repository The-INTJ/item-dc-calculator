import { jsonError, jsonSuccess, parseBody } from '../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../_lib/requireAuth';
import { RegisterContestantBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, RegisterContestantBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const userId = auth.user.uid;
  const displayName = body.data.displayName?.trim() || auth.user.displayName || 'Guest';

  // Upsert voter as competitor
  const existing = await provider.voters.getById(contest.id, userId);
  if (existing.success && existing.data) {
    const result = await provider.voters.update(contest.id, userId, { role: 'competitor' });
    if (!result.success) {
      return jsonError(result.error ?? 'Failed to update voter', 500);
    }
  } else {
    const result = await provider.voters.create(contest.id, {
      id: userId,
      displayName,
      role: 'competitor',
    });
    if (!result.success) {
      return jsonError(result.error ?? 'Failed to register', 500);
    }
  }

  // Optionally create entry
  const entryName = body.data.entryName?.trim();
  if (entryName) {
    const slug = entryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const entryResult = await provider.entries.create(contest.id, {
      name: entryName,
      slug,
      description: '',
      round: '',
      submittedBy: userId,
    });
    if (!entryResult.success) {
      return jsonError(entryResult.error ?? 'Registered but failed to create entry', 500);
    }
  }

  return jsonSuccess({ registered: true });
}
