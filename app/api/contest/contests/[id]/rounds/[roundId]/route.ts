import { fromProviderResult, jsonError, parseBody } from '../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import { UpdateRoundBodySchema } from '@/contest/lib/schemas';
import type { ContestRound } from '@/contest/contexts/contest/contestTypes';
import { resolveMatchupWinner } from '@/contest/lib/domain/winnerResolution';
import { harnessLog } from '@/lib/diagnostics/harnessLog';

interface RouteParams {
  params: Promise<{ id: string; roundId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, roundId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, UpdateRoundBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const rounds: ContestRound[] = contest.rounds ?? [];
  const idx = rounds.findIndex((round) => round.id === roundId);
  if (idx === -1) {
    return jsonError('Round not found', 404);
  }

  const nextRound: ContestRound = {
    ...rounds[idx],
    ...(body.data.name !== undefined ? { name: body.data.name } : {}),
    ...(body.data.number !== undefined ? { number: body.data.number } : {}),
    ...(body.data.adminOverride !== undefined
      ? { adminOverride: body.data.adminOverride }
      : {}),
  };

  const nextRounds = [...rounds];
  nextRounds[idx] = nextRound;

  const result = await provider.contests.update(contest.id, { rounds: nextRounds });

  // Force-closing a round is a real finalization, not just a display
  // override: every still-open matchup transitions to 'scored' with a winner
  // resolved from current scores (null on tie/no-votes — admin picks later).
  // This closes the server-side voting door — the scores/ballot routes reject
  // anything that isn't 'shake'.
  if (result.success && body.data.adminOverride === 'closed') {
    const roundMatchups = await provider.matchups.listByRound(contest.id, roundId);
    for (const matchup of roundMatchups.data ?? []) {
      if (matchup.phase === 'scored') continue;
      const resolution = resolveMatchupWinner(matchup);
      const winnerEntryId =
        matchup.winnerEntryId ?? (resolution.ok ? resolution.winnerEntryId : null);
      const update = await provider.matchups.update(contest.id, matchup.id, {
        phase: 'scored',
        winnerEntryId,
      });
      if (!update.success) {
        harnessLog({
          domain: 'admin',
          event: 'forceClose.finalizeFailed',
          level: 'error',
          data: { contestId: contest.id, roundId, matchupId: matchup.id, error: update.error },
        });
      }
    }
  }

  return fromProviderResult(result, { failureStatus: 404 });
}
