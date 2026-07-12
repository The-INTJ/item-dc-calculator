/**
 * Pure helpers describing a user's voting participation, driven by the set of
 * matchup ids they have voted on (`useUserVotesForContest`) and admin-side
 * score lists.
 */

import type {
  ContestRound,
  Matchup,
  ScoreEntry,
} from '../../contexts/contest/contestTypes';

interface ParticipationMatchup {
  matchupId?: string | null;
  isBye?: boolean;
}

export interface RoundVotingParticipation {
  /** Matchups a voter could have voted on (non-bye, backed by a stored matchup). */
  votable: number;
  /** Of those, how many this user voted on. */
  voted: number;
}

/**
 * Per-round participation summary for the round navigator's closed-round hint.
 * Byes and TBD placeholder slots are excluded — nobody votes those.
 */
export function getRoundVotingParticipation(
  round: { matchups: ParticipationMatchup[] },
  votedMatchupIds: Set<string>,
): RoundVotingParticipation {
  let votable = 0;
  let voted = 0;
  for (const matchup of round.matchups) {
    if (matchup.isBye || !matchup.matchupId) continue;
    votable += 1;
    if (votedMatchupIds.has(matchup.matchupId)) voted += 1;
  }
  return { votable, voted };
}

/**
 * Count the distinct rounds in which a user cast at least one vote.
 * Returns null when the user has no linked account (nothing to count against).
 */
export function computeVotedRoundCount(
  userId: string | null | undefined,
  contestScores: ScoreEntry[],
  matchups: Matchup[],
  rounds: ContestRound[],
): number | null {
  if (!userId) return null;

  const roundIdByMatchupId = new Map(matchups.map((m) => [m.id, m.roundId]));
  const knownRoundIds = new Set(rounds.map((r) => r.id));
  const votedRounds = new Set<string>();

  for (const score of contestScores) {
    if (score.userId !== userId || !score.matchupId) continue;
    const roundId = roundIdByMatchupId.get(score.matchupId);
    if (roundId && knownRoundIds.has(roundId)) votedRounds.add(roundId);
  }

  return votedRounds.size;
}
