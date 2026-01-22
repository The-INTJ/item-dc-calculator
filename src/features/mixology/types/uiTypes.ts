import type { Contest, Entry, ScoreEntry, ScoreBreakdown, VoteCategory } from './types';
import { getActiveRoundId, getEntriesForRound, getRoundLabel, getRoundStatus } from '../lib/contestHelpers';

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
  entryIds: string[];
  winnerEntryId?: string;
}

export interface RoundDetail {
  id: string;
  name: string;
  status: RoundStatus;
  contestId: string;
  matchups: MatchupSummary[];
  entries: EntrySummary[];
  voteSummary: VoteTotals[];
}

export interface EntrySummary {
  id: string;
  name: string | null;
  creatorName: string;
  imageUrl?: string;
}

/** @deprecated Use EntrySummary instead */
export type DrinkSummary = EntrySummary;

export interface VoteTotals {
  entryId: string;
  categoryId: string;
  total: number;
  userHasVoted: boolean;
}

const breakdownKeys: string[] = [
  'aroma',
  'balance',
  'presentation',
  'creativity',
  'overall',
];

const breakdownKeySet = new Set<string>(breakdownKeys);

function isBreakdownKey(value: string): boolean {
  return breakdownKeySet.has(value);
}

function uniqueNames(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function buildRoundSummaryFromContest(contest: Contest): RoundSummary {
  const activeRoundId = getActiveRoundId(contest);
  const activeEntries = activeRoundId ? getEntriesForRound(contest, activeRoundId) : [];
  const matchupCount = Math.floor(activeEntries.length / 2);
  const roundName = activeRoundId
    ? getRoundLabel(contest, activeRoundId)
    : contest.bracketRound ?? 'Current Round';

  return {
    id: contest.id,
    name: roundName,
    number: null,
    status: activeRoundId ? getRoundStatus(contest, activeRoundId) : 'upcoming',
    matchupCount,
    contestantNames: uniqueNames(activeEntries.map((entry) => entry.submittedBy)),
  };
}

export function buildEntrySummary(entry: Entry): EntrySummary {
  return {
    id: entry.id,
    name: entry.name || null,
    creatorName: entry.submittedBy,
  };
}

/** @deprecated Use buildEntrySummary instead */
export const buildDrinkSummary = buildEntrySummary;

export function buildVoteTotalsFromScores(scores: ScoreEntry[], categories: VoteCategory[]): VoteTotals[] {
  const totalsMap = new Map<string, number>();

  scores.forEach((score) => {
    const scoreEntryId = score.entryId ?? score.drinkId ?? '';
    categories.forEach((category) => {
      if (!isBreakdownKey(category.id)) return;
      const value = score.breakdown[category.id];
      if (typeof value !== 'number') return;
      const key = `${scoreEntryId}:${category.id}`;
      totalsMap.set(key, (totalsMap.get(key) ?? 0) + value);
    });
  });

  return Array.from(totalsMap.entries()).map(([key, total]) => {
    const [entryId, categoryId] = key.split(':');
    return {
      entryId,
      categoryId,
      total,
      userHasVoted: true,
    };
  });
}
