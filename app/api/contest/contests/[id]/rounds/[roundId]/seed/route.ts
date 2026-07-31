import { jsonError, jsonSuccess, parseBody } from '../../../../../_lib/http';
import { getContestByParam } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../../../../_lib/requireAdmin';
import { SeedRoundBodySchema } from '@/contest/lib/schemas';
import type { Contest } from '@/contest/contexts/contest/contestTypes';
import { pairWithByes } from '@/contest/lib/domain/bracketMath';
import { resolveMatchupWinner } from '@/contest/lib/domain/winnerResolution';
import {
  buildSeedInputs,
  clearRoundMatchups,
  linkPreviousRoundAdvancement,
  markByeWinners,
  type SeedSlot,
} from './seed-matchups';

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
    contest,
    rounds,
    roundIndex,
    provider,
    providedPairs: (body.data.entryIdPairs as SeedSlot[] | undefined) ?? null,
  });
  if (!resolved.ok) {
    return jsonError(resolved.error, resolved.status);
  }

  const contestantIdSet = new Set(contest.contestants.map((c) => c.id));
  for (const slot of resolved.slots) {
    for (const slotContestantId of slot) {
      if (!contestantIdSet.has(slotContestantId)) {
        return jsonError(`Contestant ${slotContestantId} is not part of the contest.`, 400);
      }
    }
  }

  const clearError = await clearRoundMatchups(provider, contest.id, roundId);
  if (clearError) {
    return jsonError(clearError, 500);
  }

  const createdResult = await provider.matchups.batchCreate(
    contest.id,
    buildSeedInputs(roundId, resolved.slots),
  );
  if (!createdResult.success || !createdResult.data) {
    return jsonError(createdResult.error ?? 'Failed to create matchups', 500);
  }
  const created = createdResult.data;

  await markByeWinners(provider, contest.id, created);

  if (roundIndex > 0) {
    await linkPreviousRoundAdvancement(provider, contest.id, rounds[roundIndex - 1].id, created);
  }

  return jsonSuccess({ matchups: created });
}

type ResolveResult =
  | { ok: true; slots: SeedSlot[] }
  | { ok: false; error: string; status: number };

async function resolveSeedSlots(args: {
  contest: Contest;
  rounds: Array<{ id: string }>;
  roundIndex: number;
  provider: Awaited<ReturnType<typeof getContestByParam>>['provider'];
  providedPairs: SeedSlot[] | null;
}): Promise<ResolveResult> {
  const { contest, rounds, roundIndex, provider, providedPairs } = args;

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
  const prevResult = await provider.matchups.listByRound(contest.id, prevRoundId);
  if (!prevResult.success || !prevResult.data) {
    return { ok: false, status: 500, error: prevResult.error ?? 'Failed to load previous round' };
  }

  const prevMatchups = [...prevResult.data].sort((a, b) => a.slotIndex - b.slotIndex);
  if (prevMatchups.length === 0) {
    return { ok: false, status: 400, error: 'Previous round has no matchups.' };
  }

  const winnerContestantByMatchupId = new Map<string, string>();
  const problems: string[] = [];

  for (const matchup of prevMatchups) {
    const slotLabel = `Matchup ${matchup.slotIndex + 1}`;

    if (matchup.phase !== 'scored') {
      problems.push(`${slotLabel}: phase is '${matchup.phase}', expected 'scored'.`);
      continue;
    }

    let resolvedWinnerEntryId = matchup.winnerEntryId ?? null;
    if (typeof resolvedWinnerEntryId !== 'string' || resolvedWinnerEntryId.length === 0) {
      const healed = resolveMatchupWinner(matchup);
      if (healed.ok) {
        resolvedWinnerEntryId = healed.winnerEntryId;
        void provider.matchups.update(contest.id, matchup.id, {
          winnerEntryId: healed.winnerEntryId,
        });
      } else {
        problems.push(`${slotLabel}: ${WINNER_PROBLEM_MESSAGES[healed.reason]}`);
        continue;
      }
    }

    const winnerEntry = matchup.entries.find((e) => e.id === resolvedWinnerEntryId);
    if (!winnerEntry) {
      problems.push(`${slotLabel}: winnerEntryId points to an unknown entry on this matchup.`);
      continue;
    }

    winnerContestantByMatchupId.set(matchup.id, winnerEntry.contestantId);
  }

  if (problems.length > 0) {
    const shown = problems.slice(0, 3).join(' ');
    const more = problems.length > 3 ? ` (+${problems.length - 3} more)` : '';
    return {
      ok: false,
      status: 400,
      error: `Cannot seed: ${shown}${more}`,
    };
  }

  const winners = prevMatchups.map((m) => winnerContestantByMatchupId.get(m.id) as string);
  const { pairs, byeId } = pairWithByes(winners);
  const slots: SeedSlot[] = [...pairs];
  if (byeId) slots.push([byeId]);
  return { ok: true, slots };
}

/** Human-readable messages for winner-resolution failures at seed time. */
const WINNER_PROBLEM_MESSAGES: Record<'no-entries' | 'no-scores' | 'tied', string> = {
  'no-entries': 'no winner set and matchup has no entries to derive from.',
  'no-scores': 'no winner set and no scores recorded yet.',
  tied: 'no winner set and scores are tied — pick a winner manually.',
};
