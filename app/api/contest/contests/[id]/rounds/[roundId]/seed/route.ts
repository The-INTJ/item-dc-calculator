import { jsonError, jsonSuccess, parseBody } from '../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../../_lib/requireAdmin';
import { SeedRoundBodySchema } from '@/contest/lib/schemas';
import type { MatchupCreateInput } from '@/contest/lib/backend/types';
import type { Matchup } from '@/contest/contexts/contest/contestTypes';

interface RouteParams {
  params: Promise<{ id: string; roundId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, roundId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return jsonError(error ?? 'Contest not found', 404);
  }

  const body = await parseBody(request, SeedRoundBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const rounds = contest.rounds ?? [];
  const roundIndex = rounds.findIndex((r) => r.id === roundId);
  if (roundIndex === -1) {
    return jsonError('Round not found', 404);
  }

  const pairs = await resolveEntryPairs({
    contestId: contest.id,
    rounds,
    roundIndex,
    provider,
    providedPairs: body.data.entryIdPairs ?? null,
  });
  if (!pairs.ok) {
    return jsonError(pairs.error, pairs.status);
  }

  const entryIdSet = new Set(contest.entries.map((entry) => entry.id));
  for (const [a, b] of pairs.pairs) {
    if (!entryIdSet.has(a) || !entryIdSet.has(b)) {
      return jsonError('Entry in pair is not part of the contest.', 400);
    }
  }

  const existing = await provider.matchups.listByRound(contest.id, roundId);
  if (!existing.success) {
    return jsonError(existing.error ?? 'Failed to load existing matchups', 500);
  }
  for (const prior of existing.data ?? []) {
    const del = await provider.matchups.delete(contest.id, prior.id);
    if (!del.success) {
      return jsonError(del.error ?? 'Failed to clear prior matchups', 500);
    }
  }

  const inputs: MatchupCreateInput[] = pairs.pairs.map(([a, b], slotIndex) => ({
    roundId,
    slotIndex,
    entryIds: [a, b],
    phase: 'set',
  }));

  const createdResult = await provider.matchups.batchCreate(contest.id, inputs);
  if (!createdResult.success || !createdResult.data) {
    return jsonError(createdResult.error ?? 'Failed to create matchups', 500);
  }
  const created = createdResult.data;

  if (roundIndex > 0) {
    const prevRoundId = rounds[roundIndex - 1].id;
    const prev = await provider.matchups.listByRound(contest.id, prevRoundId);
    if (prev.success && prev.data) {
      const prevSorted = [...prev.data].sort((a, b) => a.slotIndex - b.slotIndex);
      for (let i = 0; i < prevSorted.length; i += 1) {
        const downstream = created[Math.floor(i / 2)];
        if (!downstream) continue;
        await provider.matchups.update(contest.id, prevSorted[i].id, {
          advancesToMatchupId: downstream.id,
          advancesToSlot: i % 2,
        });
      }
    }
  }

  return jsonSuccess({ matchups: created });
}

type ResolveResult =
  | { ok: true; pairs: Array<[string, string]> }
  | { ok: false; error: string; status: number };

async function resolveEntryPairs(args: {
  contestId: string;
  rounds: Array<{ id: string }>;
  roundIndex: number;
  provider: Awaited<ReturnType<typeof getContestByParam>>['provider'];
  providedPairs: Array<[string, string]> | null;
}): Promise<ResolveResult> {
  const { contestId, rounds, roundIndex, provider, providedPairs } = args;

  if (roundIndex === 0) {
    if (!providedPairs || providedPairs.length === 0) {
      return {
        ok: false,
        status: 400,
        error: 'entryIdPairs is required for seeding the first round.',
      };
    }
    return { ok: true, pairs: providedPairs };
  }

  if (providedPairs) {
    return {
      ok: false,
      status: 400,
      error: 'entryIdPairs is only allowed when seeding the first round.',
    };
  }

  const prevRoundId = rounds[roundIndex - 1].id;
  const prevResult = await provider.matchups.listByRound(contestId, prevRoundId);
  if (!prevResult.success || !prevResult.data) {
    return { ok: false, status: 500, error: prevResult.error ?? 'Failed to load previous round' };
  }

  const prevMatchups = [...prevResult.data].sort((a, b) => a.slotIndex - b.slotIndex);
  if (prevMatchups.length === 0) {
    return { ok: false, status: 400, error: 'Previous round has no matchups.' };
  }
  if (!prevMatchups.every(isScoredWithWinner)) {
    return {
      ok: false,
      status: 400,
      error: 'All previous-round matchups must be scored with a winner before seeding.',
    };
  }

  const winners = prevMatchups.map((m) => m.winnerEntryId as string);
  if (winners.length % 2 !== 0) {
    return {
      ok: false,
      status: 400,
      error: 'Previous round has an odd number of matchups; cannot pair winners.',
    };
  }

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push([winners[i], winners[i + 1]]);
  }
  return { ok: true, pairs };
}

function isScoredWithWinner(matchup: Matchup): boolean {
  return matchup.phase === 'scored' && typeof matchup.winnerEntryId === 'string';
}
