import { fromProviderResult, jsonError, parseBody } from '../../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../../../../../_lib/requireAuth';
import { SetMatchupEntryNameBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string; matchupId: string; entryId: string }>;
}

/**
 * PUT /api/contest/contests/{id}/matchups/{matchupId}/entries/{entryId}
 *
 * Sets the name (and optionally description) for a contestant's per-matchup
 * entry. Allowed if the caller is admin OR is the contestant who owns the
 * entry (matched via Contestant.userId).
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { id: contestParam, matchupId, entryId } = await params;
  const { provider, contest, error } = await getContestByParam(contestParam);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, SetMatchupEntryNameBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const matchupResult = await provider.matchups.getById(contest.id, matchupId);
  if (!matchupResult.success || !matchupResult.data) {
    return jsonError(matchupResult.error ?? 'Matchup not found', 404);
  }

  const matchup = matchupResult.data;
  const entry = matchup.entries.find((e) => e.id === entryId);
  if (!entry) {
    return jsonError('Entry not found on matchup', 404);
  }

  const isAdmin = auth.user.role === 'admin';
  const owningContestant = contest.contestants.find((c) => c.id === entry.contestantId);
  const isOwner = owningContestant?.userId === auth.user.uid;

  if (!isAdmin && !isOwner) {
    return jsonError('Only the contestant or an admin can rename this entry', 403);
  }

  const result = await provider.matchups.setEntryName(contest.id, matchupId, entryId, {
    name: body.data.name,
    ...(body.data.description !== undefined ? { description: body.data.description } : {}),
  });
  return fromProviderResult(result, { failureStatus: 400 });
}
