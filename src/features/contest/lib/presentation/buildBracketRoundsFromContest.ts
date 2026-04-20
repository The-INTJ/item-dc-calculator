import type {
  Contest,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';
import { getContestRounds, getEntryScore } from '../domain/contestGetters';
import { getComputedRoundStatus, getMatchupsForRound } from '../domain/matchupGetters';

export type BracketRoundStatus = RoundStatus;

export interface BracketContestant {
  id: string;
  name: string;
  score?: number | null;
}

export interface BracketMatchup {
  id: string;
  contestantA: BracketContestant;
  contestantB: BracketContestant;
  winnerId?: string | null;
  /** Stored matchup document id. */
  matchupId?: string;
  /** Matchup lifecycle phase. */
  phase?: MatchupPhase;
}

export interface BracketRound {
  id: string;
  name: string;
  status: BracketRoundStatus;
  matchups: BracketMatchup[];
}

/**
 * Build bracket rounds from a contest and its stored matchup collection.
 * Matchups are the authoritative source for round seeding and status.
 */
export function buildBracketRoundsFromContest(
  contest: Contest,
  matchups: Matchup[],
): BracketRound[] {
  const rounds = getContestRounds(contest);
  const entriesById = new Map(contest.entries.map((entry) => [entry.id, entry]));

  return rounds.map((round, index) => {
    const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
      (a, b) => a.slotIndex - b.slotIndex,
    );

    const bracketMatchups: BracketMatchup[] = roundMatchups.map((matchup) => {
      const entryA = entriesById.get(matchup.entryIds[0] ?? '') ?? null;
      const entryB = entriesById.get(matchup.entryIds[1] ?? '') ?? null;

      const contestantA: BracketContestant = entryA
        ? { id: entryA.id, name: entryA.name ?? 'TBD', score: getEntryScore(entryA) }
        : { id: 'tbd-a', name: 'TBD', score: null };
      const contestantB: BracketContestant = entryB
        ? { id: entryB.id, name: entryB.name ?? 'TBD', score: getEntryScore(entryB) }
        : { id: 'tbd-b', name: 'TBD', score: null };

      return {
        id: matchup.id,
        contestantA,
        contestantB,
        winnerId: matchup.winnerEntryId ?? null,
        matchupId: matchup.id,
        phase: matchup.phase,
      };
    });

    return {
      id: round.id,
      name: round.name || `Round ${index + 1}`,
      status: getComputedRoundStatus(round, matchups),
      matchups: bracketMatchups,
    };
  });
}
