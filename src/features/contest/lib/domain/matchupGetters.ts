import type {
  Contest,
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

export function getEntriesInMatchup(matchup: Matchup, contest: Contest): Entry[] {
  const byId = new Map(contest.entries.map((e) => [e.id, e]));
  return matchup.entryIds.map((id) => byId.get(id)).filter((e): e is Entry => e != null);
}

/**
 * Compute a round's status from its matchups and admin override.
 *
 *   no matchups                       → 'pending'
 *   adminOverride === 'closed'        → 'closed'
 *   adminOverride === 'active'        → 'active'
 *   every matchup phase === 'scored'  → 'closed'
 *   every matchup phase === 'set'     → 'upcoming'
 *   otherwise                         → 'active'
 */
export function getComputedRoundStatus(round: ContestRound, matchups: Matchup[]): RoundStatus {
  const scoped = matchups.filter((m) => m.roundId === round.id);
  if (scoped.length === 0) return 'pending';
  if (round.adminOverride === 'closed') return 'closed';
  if (round.adminOverride === 'active') return 'active';
  if (scoped.every((m) => m.phase === 'scored')) return 'closed';
  if (scoped.every((m) => m.phase === 'set')) return 'upcoming';
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
