import type { Contest, ContestRound, Entry } from '../../contexts/contest/contestTypes';

export function getContestRounds(contest: Contest): ContestRound[] {
  return contest.rounds ?? [];
}

export function getRoundById(
  contest: Contest,
  roundId: string | null | undefined,
): ContestRound | null {
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
 * Get the average score for an entry from its aggregates.
 * Uses sumScore / voteCount stored directly on the entry — no need to query all votes.
 */
export function getEntryScore(entry: Entry): number | null {
  if (!entry.voteCount || entry.voteCount === 0) return null;
  return Math.round((entry.sumScore ?? 0) / entry.voteCount);
}
