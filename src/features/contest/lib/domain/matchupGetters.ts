import type {
  Contest,
  Contestant,
  ContestRound,
  Entry,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';

export function getMatchupsForRound(matchups: Matchup[], roundId: string): Matchup[] {
  return matchups.filter((m) => m.roundId === roundId);
}

export function getMatchupPhase(matchup: Matchup): MatchupPhase {
  return matchup.phase;
}

export function getEntriesInMatchup(matchup: Matchup): Entry[] {
  return matchup.entries ?? [];
}

export function getContestantById(
  contest: Contest,
  contestantId: string | null | undefined,
): Contestant | null {
  if (!contestantId) return null;
  return contest.contestants.find((c) => c.id === contestantId) ?? null;
}

export function getContestantDisplayName(
  contest: Contest,
  contestantId: string | null | undefined,
): string {
  return getContestantById(contest, contestantId)?.displayName ?? 'TBD';
}

/**
 * Sum a contestant's aggregate scores across every matchup they appear in.
 */
export function getContestantTotals(
  contestantId: string,
  matchups: Matchup[],
): { sumScore: number; voteCount: number } {
  let sumScore = 0;
  let voteCount = 0;
  for (const matchup of matchups) {
    for (const entry of matchup.entries ?? []) {
      if (entry.contestantId !== contestantId) continue;
      sumScore += entry.sumScore ?? 0;
      voteCount += entry.voteCount ?? 0;
    }
  }
  return { sumScore, voteCount };
}

/**
 * Compute a round's status from its matchups and admin override.
 *
 *   no matchups                          → 'pending'
 *   adminOverride === 'closed'           → 'closed'
 *   adminOverride === 'active'           → 'active'
 *   every contested matchup 'scored'     → 'closed'
 *   every contested matchup 'set'        → 'upcoming'
 *   otherwise                            → 'active'
 *
 * Byes (single-entry matchups) are auto-scored the moment a round is seeded,
 * so they're excluded from the phase math — otherwise a freshly seeded odd
 * round would read 'active' ("Now voting") before anything opened. A round
 * containing only byes is already decided → 'closed'.
 */
export function getComputedRoundStatus(round: ContestRound, matchups: Matchup[]): RoundStatus {
  const scoped = matchups.filter((m) => m.roundId === round.id);
  if (scoped.length === 0) return 'pending';
  if (round.adminOverride === 'closed') return 'closed';
  if (round.adminOverride === 'active') return 'active';
  const contested = scoped.filter((m) => (m.entries?.length ?? 0) !== 1);
  if (contested.length === 0) return 'closed';
  if (contested.every((m) => m.phase === 'scored')) return 'closed';
  if (contested.every((m) => m.phase === 'set')) return 'upcoming';
  return 'active';
}

/**
 * Entry IDs of the winners of every scored matchup in the given list.
 * Matchups without a winner yet are skipped.
 */
export function getRoundWinnerEntryIds(matchups: Matchup[]): string[] {
  const winners: string[] = [];
  for (const m of matchups) {
    if (m.phase === 'scored' && m.winnerEntryId) winners.push(m.winnerEntryId);
  }
  return winners;
}

/**
 * Derive the active round from rounds and matchups.
 * Picks the first round whose computed status is 'active';
 * otherwise the first 'upcoming'; otherwise null.
 */
export function getActiveRoundIdFromMatchups(
  rounds: ContestRound[],
  matchups: Matchup[],
): string | null {
  for (const round of rounds) {
    if (getComputedRoundStatus(round, matchups) === 'active') return round.id;
  }
  for (const round of rounds) {
    if (getComputedRoundStatus(round, matchups) === 'upcoming') return round.id;
  }
  return null;
}
