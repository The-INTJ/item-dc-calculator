import type {
  Contest,
  Entry,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';
import { getContestRounds, getEntryScore } from '../domain/contestGetters';
import { getEntryDisplayName } from '../domain/entryLabels';
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
  /** True when this is a single-entry bye (auto-advance). */
  isBye?: boolean;
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
  const contestantsById = new Map(contest.contestants.map((c) => [c.id, c]));

  function buildContestant(entry: Entry | undefined, fallbackId: string): BracketContestant {
    if (!entry) return { id: fallbackId, name: 'TBD', score: null };
    const contestant = contestantsById.get(entry.contestantId) ?? null;
    const drink = entry.name?.trim();
    const label = drink
      ? contestant?.displayName
        ? `${drink} — ${contestant.displayName}`
        : drink
      : getEntryDisplayName(entry, contestant) ?? 'TBD';
    return { id: entry.id, name: label, score: getEntryScore(entry) };
  }

  return rounds.map((round, index) => {
    const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
      (a, b) => a.slotIndex - b.slotIndex,
    );

    const bracketMatchups: BracketMatchup[] = roundMatchups.map((matchup) => {
      const entryA = matchup.entries?.[0];
      const entryB = matchup.entries?.[1];

      return {
        id: matchup.id,
        contestantA: buildContestant(entryA, 'tbd-a'),
        contestantB: buildContestant(entryB, 'tbd-b'),
        winnerId: matchup.winnerEntryId ?? null,
        matchupId: matchup.id,
        phase: matchup.phase,
        isBye: (matchup.entries?.length ?? 0) === 1,
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
