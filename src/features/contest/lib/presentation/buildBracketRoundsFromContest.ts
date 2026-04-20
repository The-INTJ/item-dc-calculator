import type {
  Contest,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';
import { getContestRounds, getEntriesForRound, getEntryScore, getRoundStatus } from '../domain/contestGetters';
import {
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../domain/matchupGetters';
import { buildEntryPairs } from './uiMappings';

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
  /** Stored matchup document id (present when driven from Matchup[]). */
  matchupId?: string;
  /** Matchup lifecycle phase (present when driven from Matchup[]). */
  phase?: MatchupPhase;
}

export interface BracketRound {
  id: string;
  name: string;
  status: BracketRoundStatus;
  matchups: BracketMatchup[];
}

/**
 * Build bracket rounds from a contest. When `matchups` is provided and
 * non-empty, rounds are driven from the stored matchup collection (matchupId
 * and phase are populated on each BracketMatchup). When omitted or empty, the
 * builder falls back to legacy entry-pair inference so existing callers keep
 * working during the matchup refactor.
 */
export function buildBracketRoundsFromContest(
  contest: Contest,
  matchups: Matchup[] = [],
): BracketRound[] {
  if (matchups.length > 0) {
    return buildFromMatchups(contest, matchups);
  }
  return buildLegacy(contest);
}

function buildFromMatchups(contest: Contest, matchups: Matchup[]): BracketRound[] {
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

function buildLegacy(contest: Contest): BracketRound[] {
  const rounds = getContestRounds(contest);

  return rounds.map((round, index) => {
    const entries = getEntriesForRound(contest, round.id);
    const matchups = buildEntryPairs(entries).map((matchup) => {
      const firstEntry = matchup.contestantA;
      const secondEntry = matchup.contestantB;
      const contestantA = firstEntry
        ? {
            id: firstEntry.id,
            name: firstEntry.name ?? 'TBD',
            score: getEntryScore(firstEntry),
          }
        : { id: 'tbd-a', name: 'TBD', score: null };
      const contestantB = secondEntry
        ? {
            id: secondEntry.id,
            name: secondEntry.name ?? 'TBD',
            score: getEntryScore(secondEntry),
          }
        : { id: 'tbd-b', name: 'TBD', score: null };

      return {
        id: matchup.id,
        contestantA,
        contestantB,
        winnerId: null,
      };
    });

    return {
      id: round.id,
      name: round.name || `Round ${index + 1}`,
      status: getRoundStatus(contest, round.id),
      matchups,
    };
  });
}
