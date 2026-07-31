import type {
  Contest,
  Entry,
  Matchup,
  ScoreEntry,
  UserRole,
} from '../../contexts/contest/contestTypes';
import { computeVotedRoundCount } from '../../lib/presentation/votingParticipation';

export interface MatchupEntryRef {
  matchup: Matchup;
  entry: Entry;
  roundId: string;
  roundIndex: number;
}

export interface ParticipantDetails {
  id: string;
  contestantId: string | null;
  displayName: string;
  role: UserRole;
  entries: MatchupEntryRef[];
  totalRounds: number;
  /** Distinct rounds this participant voted in; null when no account is linked. */
  votedRoundCount: number | null;
}

export function participationLabel(participant: ParticipantDetails): string {
  if (participant.votedRoundCount === null) return 'No account linked';
  return `Voted ${participant.votedRoundCount}/${participant.totalRounds} rounds`;
}

/**
 * Index every matchup entry by its contestant, ordered by round then slot.
 */
export function buildEntriesByContestantId(
  matchups: Matchup[],
  rounds: NonNullable<Contest['rounds']>,
): Map<string, MatchupEntryRef[]> {
  const map = new Map<string, MatchupEntryRef[]>();
  for (const matchup of matchups) {
    const roundIndex = rounds.findIndex((r) => r.id === matchup.roundId);
    for (const entry of matchup.entries ?? []) {
      const key = entry.contestantId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ matchup, entry, roundId: matchup.roundId, roundIndex });
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.roundIndex - b.roundIndex || a.matchup.slotIndex - b.matchup.slotIndex);
  }
  return map;
}

/**
 * Merge contestants and non-contestant voters into a single alphabetized
 * participant list with placement and vote-participation details.
 */
export function buildParticipants(
  contestants: NonNullable<Contest['contestants']>,
  voters: NonNullable<Contest['voters']>,
  entriesByContestantId: Map<string, MatchupEntryRef[]>,
  rounds: NonNullable<Contest['rounds']>,
  matchups: Matchup[],
  contestScores: ScoreEntry[],
): ParticipantDetails[] {
  const list: ParticipantDetails[] = [];

  // Build contestant entries first (they're the per-matchup competitors)
  for (const c of contestants) {
    const linkedVoter = c.userId ? voters.find((v) => v.id === c.userId) : null;
    list.push({
      id: c.id,
      contestantId: c.id,
      displayName: c.displayName,
      role: linkedVoter?.role ?? 'competitor',
      entries: entriesByContestantId.get(c.id) ?? [],
      totalRounds: rounds.length,
      votedRoundCount: computeVotedRoundCount(c.userId, contestScores, matchups, rounds),
    });
  }

  // Append voters who are NOT contestants, with their vote participation.
  const linkedUserIds = new Set(contestants.map((c) => c.userId).filter(Boolean) as string[]);
  for (const voter of voters) {
    if (linkedUserIds.has(voter.id)) continue;
    list.push({
      id: voter.id,
      contestantId: null,
      displayName: voter.displayName,
      role: voter.role,
      entries: [],
      totalRounds: rounds.length,
      votedRoundCount: computeVotedRoundCount(voter.id, contestScores, matchups, rounds),
    });
  }

  return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
