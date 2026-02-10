import type { Contest, ContestRound, Entry } from '../../contexts/contest/contestTypes';

export function getContestRounds(contest: Contest): ContestRound[] {
  return contest.rounds ?? [];
}

export function getActiveRoundId(contest: Contest): string | null {
  const rounds = getContestRounds(contest);
  return contest.activeRoundId ?? rounds[0]?.id ?? null;
}

export function getFutureRoundId(contest: Contest): string | null {
  const rounds = getContestRounds(contest);
  const activeRoundId = getActiveRoundId(contest);
  if (contest.futureRoundId) return contest.futureRoundId;
  const activeIndex = rounds.findIndex((round) => round.id === activeRoundId);
  return rounds[activeIndex + 1]?.id ?? null;
}

export function getRoundById(contest: Contest, roundId: string | null | undefined): ContestRound | null {
  if (!roundId) return null;
  return getContestRounds(contest).find((round) => round.id === roundId) ?? null;
}

export function getRoundLabel(contest: Contest, roundId: string | null | undefined): string {
  if (!roundId) return 'Unassigned';
  const rounds = getContestRounds(contest);
  const roundIndex = rounds.findIndex((round) => round.id === roundId);
  if (roundIndex !== -1) return `Round ${roundIndex + 1}`;
  return 'Unassigned';
}

/**
 * Get entries for a specific round.
 * Handles both legacy entries (stored with round name) and new entries (stored with round ID).
 * @param contest - The contest containing entries and rounds
 * @param roundId - The round ID to filter by
 * @returns Array of entries matching the specified round
 */
export function getEntriesForRound(contest: Contest, roundId: string | null | undefined): Entry[] {
  if (!roundId) return [];
  const round = getRoundById(contest, roundId);
  return contest.entries?.filter((entry) => entry.round === roundId || entry.round === round?.name) ?? [];
}

export function getRoundStatus(contest: Contest, roundId: string): 'upcoming' | 'active' | 'closed' {
  const rounds = getContestRounds(contest);
  const activeRoundId = getActiveRoundId(contest);
  const futureRoundId = getFutureRoundId(contest);

  if (roundId === activeRoundId) return 'active';
  if (roundId === futureRoundId) return 'upcoming';

  const activeIndex = rounds.findIndex((round) => round.id === activeRoundId);
  const roundIndex = rounds.findIndex((round) => round.id === roundId);

  if (activeIndex === -1 || roundIndex === -1) return 'upcoming';
  return roundIndex < activeIndex ? 'closed' : 'upcoming';
}

/**
 * Get the average score for an entry from its aggregates.
 * Uses sumScore / voteCount stored directly on the entry — no need to query all votes.
 */
export function getEntryScore(entry: Entry): number | null {
  if (!entry.voteCount || entry.voteCount === 0) return null;
  return Math.round((entry.sumScore ?? 0) / entry.voteCount);
}
