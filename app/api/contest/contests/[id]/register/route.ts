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
  const contact = body.data.contact?.trim();

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

  // Upsert contestant identity (linked by userId so self-vote checks work)
  const existingContestant = contest.contestants.find((c) => c.userId === userId);
  let contestantId: string;
  if (existingContestant) {
    contestantId = existingContestant.id;
    const updateRes = await provider.contestants.update(contest.id, existingContestant.id, {
      displayName,
      ...(contact ? { contact } : {}),
    });
    if (!updateRes.success) {
      return jsonError(updateRes.error ?? 'Failed to update contestant', 500);
    }
  } else {
    const createRes = await provider.contestants.create(contest.id, {
      displayName,
      userId,
      ...(contact ? { contact } : {}),
    });
    if (!createRes.success || !createRes.data) {
      return jsonError(createRes.error ?? 'Failed to register contestant', 500);
    }
    contestantId = createRes.data.id;
  }

  return jsonSuccess({ registered: true, contestantId });
}
