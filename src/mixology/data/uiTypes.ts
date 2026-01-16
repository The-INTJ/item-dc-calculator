import type { Contest, Drink, ScoreEntry } from '../types';

export type RoundStatus = 'upcoming' | 'active' | 'closed';

export interface RoundSummary {
  id: string;
  name: string;
  number: number | null;
  status: RoundStatus;
  matchupCount: number;
  contestantNames: string[];
}

export interface MatchupSummary {
  id: string;
  drinkIds: string[];
  winnerDrinkId?: string;
}

export interface RoundDetail {
  id: string;
  name: string;
  status: RoundStatus;
  contestId: string;
  matchups: MatchupSummary[];
  drinks: DrinkSummary[];
  voteSummary: VoteTotals[];
}

export interface DrinkSummary {
  id: string;
  name: string | null;
  creatorName: string;
  imageUrl?: string;
}

export interface VoteCategory {
  id: string;
  label: string;
  description?: string;
  sortOrder: number;
}

export interface VoteTotals {
  drinkId: string;
  categoryId: string;
  total: number;
  userHasVoted: boolean;
}

const roundPhaseMap: Record<Contest['phase'], RoundStatus> = {
  setup: 'upcoming',
  active: 'active',
  judging: 'active',
  closed: 'closed',
};

function uniqueNames(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function buildRoundSummaryFromContest(contest: Contest): RoundSummary {
  const matchupCount = Math.floor(contest.drinks.length / 2);

  return {
    id: contest.id,
    name: contest.bracketRound ?? 'Current Round',
    number: null,
    status: roundPhaseMap[contest.phase],
    matchupCount,
    contestantNames: uniqueNames(contest.drinks.map((drink) => drink.submittedBy)),
  };
}

export function buildDrinkSummary(drink: Drink): DrinkSummary {
  return {
    id: drink.id,
    name: drink.name || null,
    creatorName: drink.submittedBy,
  };
}

export function buildVoteTotalsFromScores(scores: ScoreEntry[]): VoteTotals[] {
  return scores.map((score) => ({
    drinkId: score.drinkId,
    categoryId: 'overall',
    total: score.breakdown.overall,
    userHasVoted: true,
  }));
}
