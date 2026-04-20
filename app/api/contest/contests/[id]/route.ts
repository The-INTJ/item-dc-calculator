import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../_lib/requireAdmin';
import { UpdateContestBodySchema } from '@/contest/lib/schemas';

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

  const body = await parseBody(request, UpdateContestBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const rejection = rejectDeprecatedFields(body.data);
  if (rejection) {
    return jsonError(rejection, 400);
  }

  const result = await provider.contests.update(contest.id, body.data);
  return fromProviderResult(result, { failureStatus: 404 });
}

const DEPRECATED_CONTEST_FIELDS = [
  'phase',
  'activeRoundId',
  'futureRoundId',
  'bracketRound',
] as const;

function rejectDeprecatedFields(body: Record<string, unknown>): string | null {
  for (const field of DEPRECATED_CONTEST_FIELDS) {
    if (field in body) {
      return `Field "${field}" is no longer writable. Round status is computed from matchup phases.`;
    }
  }
  const rounds = body.rounds;
  if (Array.isArray(rounds)) {
    for (const round of rounds) {
      if (round && typeof round === 'object' && 'state' in round) {
        return 'Round.state is no longer writable. Use adminOverride or per-matchup phase instead.';
      }
    }
  }
  return null;
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

  return new NextResponse(null, { status: 204 });
}
