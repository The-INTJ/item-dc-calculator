import { jsonError, jsonSuccess, parseBody } from '../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../../_lib/requireAdmin';
import { SeedRoundBodySchema } from '@/contest/lib/schemas';
import type { MatchupCreateInput } from '@/contest/lib/backend/types';
import type { Matchup } from '@/contest/contexts/contest/contestTypes';
import { pairWithByes } from '@/contest/lib/domain/bracketMath';

type SeedSlot = [string, string] | [string];

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

  const resolved = await resolveSeedSlots({
    contestId: contest.id,
    rounds,
    roundIndex,
    provider,
    providedPairs: (body.data.entryIdPairs as SeedSlot[] | undefined) ?? null,
  });
  if (!resolved.ok) {
    return jsonError(resolved.error, resolved.status);
  }

  const entryIdSet = new Set(contest.entries.map((entry) => entry.id));
  for (const slot of resolved.slots) {
    for (const id of slot) {
      if (!entryIdSet.has(id)) {
        return jsonError('Entry in pair is not part of the contest.', 400);
      }
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

  const inputs: MatchupCreateInput[] = resolved.slots.map((slot, slotIndex) => {
    if (slot.length === 1) {
      return {
        roundId,
        slotIndex,
        entryIds: [slot[0]],
        phase: 'scored',
        winnerEntryId: slot[0],
      };
    }
    return {
      roundId,
      slotIndex,
      entryIds: [slot[0], slot[1]],
      phase: 'set',
    };
  });

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
  | { ok: true; slots: SeedSlot[] }
  | { ok: false; error: string; status: number };

async function resolveSeedSlots(args: {
  contestId: string;
  rounds: Array<{ id: string }>;
  roundIndex: number;
  provider: Awaited<ReturnType<typeof getContestByParam>>['provider'];
  providedPairs: SeedSlot[] | null;
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
    return { ok: true, slots: providedPairs };
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
  const { pairs, byeId } = pairWithByes(winners);
  const slots: SeedSlot[] = [...pairs];
  if (byeId) slots.push([byeId]);
  return { ok: true, slots };
}

function isScoredWithWinner(matchup: Matchup): boolean {
  return matchup.phase === 'scored' && typeof matchup.winnerEntryId === 'string';
}
