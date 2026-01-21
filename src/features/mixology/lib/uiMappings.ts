import type { Contest, Entry } from '../types';
import {
  buildEntrySummary,
  buildRoundSummaryFromContest,
  buildVoteTotalsFromScores,
  type MatchupSummary,
  type RoundDetail,
  type RoundSummary,
  type EntrySummary,
  type VoteTotals,
} from '../types/uiTypes';
import { getActiveRoundId, getEntriesForRound } from './contestHelpers';

export function buildRoundSummary(contest: Contest): RoundSummary {
  return buildRoundSummaryFromContest(contest);
}

export function buildEntrySummaries(entries: Entry[]): EntrySummary[] {
  return entries.map((entry) => buildEntrySummary(entry));
}

export function buildMatchupsFromDrinks(drinks: Entry[]): MatchupSummary[] {
  const matchups: MatchupSummary[] = [];

  for (let index = 0; index < drinks.length; index += 2) {
    const entryIds = [drinks[index]?.id, drinks[index + 1]?.id].filter(Boolean) as string[];

    matchups.push({
      id: `matchup-${Math.floor(index / 2) + 1}`,
      entryIds,
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
  const activeDrinks = activeRoundId ? getEntriesForRound(contest, activeRoundId) : [];

  return {
    id: contest.id,
    name: roundSummary.name,
    status: roundSummary.status,
    contestId: contest.id,
    matchups: buildMatchupsFromDrinks(activeDrinks),
    entries: buildEntrySummaries(activeDrinks),
    voteSummary: buildVoteTotalsFromScores(contest.scores, contest.categories ?? []),
  };
}