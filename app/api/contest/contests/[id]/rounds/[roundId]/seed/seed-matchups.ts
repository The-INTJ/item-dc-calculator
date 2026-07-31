import type { BackendProvider, MatchupCreateInput } from '@/contest/lib/backend/types';
import type { Matchup } from '@/contest/contexts/contest/contestTypes';

export type SeedSlot = [string, string] | [string];

/**
 * A one-contestant slot is a bye: it is created already `scored` so the
 * bracket can advance past it without anyone voting.
 */
export function buildSeedInputs(roundId: string, slots: SeedSlot[]): MatchupCreateInput[] {
  return slots.map((slot, slotIndex) =>
    slot.length === 1
      ? { roundId, slotIndex, contestantIds: [slot[0]], phase: 'scored' }
      : { roundId, slotIndex, contestantIds: [slot[0], slot[1]], phase: 'set' },
  );
}

/** Re-seeding replaces a round outright, so any prior matchups go first. */
export async function clearRoundMatchups(
  provider: BackendProvider,
  contestId: string,
  roundId: string,
): Promise<string | null> {
  const existing = await provider.matchups.listByRound(contestId, roundId);
  if (!existing.success) {
    return existing.error ?? 'Failed to load existing matchups';
  }
  for (const prior of existing.data ?? []) {
    const del = await provider.matchups.delete(contestId, prior.id);
    if (!del.success) {
      return del.error ?? 'Failed to clear prior matchups';
    }
  }
  return null;
}

/**
 * For byes the auto-advance must reference a real entry id, which only exists
 * once the matchup is created — so the lone entry is marked winner here rather
 * than in the create input.
 */
export async function markByeWinners(
  provider: BackendProvider,
  contestId: string,
  created: Matchup[],
): Promise<void> {
  for (const matchup of created) {
    if (matchup.phase === 'scored' && matchup.entries.length === 1 && !matchup.winnerEntryId) {
      const update = await provider.matchups.update(contestId, matchup.id, {
        winnerEntryId: matchup.entries[0].id,
      });
      if (update.success && update.data) {
        matchup.winnerEntryId = update.data.winnerEntryId;
      }
    }
  }
}

/**
 * Point each matchup of the previous round at the new matchup its winner feeds
 * into. Slots pair up two-to-one in bracket order, so slot i advances into
 * `created[i / 2]` and takes side `i % 2` of it.
 */
export async function linkPreviousRoundAdvancement(
  provider: BackendProvider,
  contestId: string,
  prevRoundId: string,
  created: Matchup[],
): Promise<void> {
  const prev = await provider.matchups.listByRound(contestId, prevRoundId);
  if (!prev.success || !prev.data) return;

  const prevSorted = [...prev.data].sort((a, b) => a.slotIndex - b.slotIndex);
  for (let i = 0; i < prevSorted.length; i += 1) {
    const downstream = created[Math.floor(i / 2)];
    if (!downstream) continue;
    await provider.matchups.update(contestId, prevSorted[i].id, {
      advancesToMatchupId: downstream.id,
      advancesToSlot: i % 2,
    });
  }
}
