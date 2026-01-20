import type { Contest, Drink } from '../types';
import {
  buildDrinkSummary,
  buildRoundSummaryFromContest,
  buildVoteTotalsFromScores,
  type MatchupSummary,
  type RoundDetail,
  type RoundSummary,
  type DrinkSummary,
  type VoteTotals,
} from '../types/uiTypes';
import { getActiveRoundId, getDrinksForRound } from './contestHelpers';

export function buildRoundSummary(contest: Contest): RoundSummary {
  return buildRoundSummaryFromContest(contest);
}

export function buildDrinkSummaries(drinks: Drink[]): DrinkSummary[] {
  return drinks.map((drink) => buildDrinkSummary(drink));
}

export function buildMatchupsFromDrinks(drinks: Drink[]): MatchupSummary[] {
  const matchups: MatchupSummary[] = [];

  for (let index = 0; index < drinks.length; index += 2) {
    const drinkIds = [drinks[index]?.id, drinks[index + 1]?.id].filter(Boolean) as string[];

    matchups.push({
      id: `matchup-${Math.floor(index / 2) + 1}`,
      drinkIds,
    });
  }

  return matchups;
}

export function buildVoteTotals(contest: Contest): VoteTotals[] {
  return buildVoteTotalsFromScores(contest.scores, contest.categories ?? []);
}

export function buildRoundDetail(contest: Contest): RoundDetail {
  const roundSummary = buildRoundSummaryFromContest(contest);
  const activeRoundId = getActiveRoundId(contest);
  const activeDrinks = activeRoundId ? getDrinksForRound(contest, activeRoundId) : [];

  return {
    id: contest.id,
    name: roundSummary.name,
    status: roundSummary.status,
    contestId: contest.id,
    matchups: buildMatchupsFromDrinks(activeDrinks),
    drinks: buildDrinkSummaries(activeDrinks),
    voteSummary: buildVoteTotalsFromScores(contest.scores, contest.categories ?? []),
  };
}