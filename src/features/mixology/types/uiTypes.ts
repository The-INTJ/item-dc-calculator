import type { Contest, Drink, ScoreEntry, ScoreBreakdown, VoteCategory } from './types';
import { getActiveRoundId, getDrinksForRound, getRoundLabel, getRoundStatus } from '../lib/contestHelpers';

export type { VoteCategory } from './types';

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

export interface VoteTotals {
  drinkId: string;
  categoryId: string;
  total: number;
  userHasVoted: boolean;
}

const breakdownKeys: Array<keyof ScoreBreakdown> = [
  'aroma',
  'balance',
  'presentation',
  'creativity',
  'overall',
];

const breakdownKeySet = new Set<string>(breakdownKeys);

function isBreakdownKey(value: string): value is keyof ScoreBreakdown {
  return breakdownKeySet.has(value);
}

function uniqueNames(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function buildRoundSummaryFromContest(contest: Contest): RoundSummary {
  const activeRoundId = getActiveRoundId(contest);
  const activeDrinks = activeRoundId ? getDrinksForRound(contest, activeRoundId) : [];
  const matchupCount = Math.floor(activeDrinks.length / 2);
  const roundName = activeRoundId
    ? getRoundLabel(contest, activeRoundId)
    : contest.bracketRound ?? 'Current Round';

  return {
    id: contest.id,
    name: roundName,
    number: null,
    status: activeRoundId ? getRoundStatus(contest, activeRoundId) : 'upcoming',
    matchupCount,
    contestantNames: uniqueNames(activeDrinks.map((drink) => drink.submittedBy)),
  };
}

export function buildDrinkSummary(drink: Drink): DrinkSummary {
  return {
    id: drink.id,
    name: drink.name || null,
    creatorName: drink.submittedBy,
  };
}

export function buildVoteTotalsFromScores(scores: ScoreEntry[], categories: VoteCategory[]): VoteTotals[] {
  const totalsMap = new Map<string, number>();

  scores.forEach((score) => {
    categories.forEach((category) => {
      if (!isBreakdownKey(category.id)) return;
      const value = score.breakdown[category.id];
      if (typeof value !== 'number') return;
      const key = `${score.drinkId}:${category.id}`;
      totalsMap.set(key, (totalsMap.get(key) ?? 0) + value);
    });
  });

  return Array.from(totalsMap.entries()).map(([key, total]) => {
    const [drinkId, categoryId] = key.split(':');
    return {
      drinkId,
      categoryId,
      total,
      userHasVoted: true,
    };
  });
}
