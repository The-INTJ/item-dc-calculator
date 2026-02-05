import type { Contest, Entry, ScoreEntry } from '../../contexts/contest/contestTypes';
import { getActiveRoundId, getEntriesForRound, getRoundLabel, getRoundStatus } from './contestGetters';

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

export interface VoteTotals {
  entryId: string;
  categoryId: string;
  total: number;
  userHasVoted: boolean;
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

export function buildRoundSummary(contest: Contest): RoundSummary {
  return buildRoundSummaryFromContest(contest);
}

export function buildEntrySummaries(entries: Entry[]): EntrySummary[] {
  return entries.map((entry) => buildEntrySummary(entry));
}

export function buildMatchupsFromEntries(entries: Entry[]): MatchupSummary[] {
  const matchups: MatchupSummary[] = [];

  for (let index = 0; index < entries.length; index += 2) {
    const entryIds = [entries[index]?.id, entries[index + 1]?.id].filter(Boolean) as string[];

    matchups.push({
      id: `matchup-${Math.floor(index / 2) + 1}`,
      entryIds,
    });
  }

  return matchups;
}

export function buildRoundDetail(contest: Contest): RoundDetail {
  const roundSummary = buildRoundSummaryFromContest(contest);
  const activeRoundId = getActiveRoundId(contest);
  const activeEntries = activeRoundId ? getEntriesForRound(contest, activeRoundId) : [];

  return {
    id: contest.id,
    name: roundSummary.name,
    status: roundSummary.status,
    contestId: contest.id,
    matchups: buildMatchupsFromEntries(activeEntries),
    entries: buildEntrySummaries(activeEntries),
    voteSummary: [],
  };
}
