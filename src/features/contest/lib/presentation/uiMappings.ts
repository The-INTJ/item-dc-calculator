import type { Contestant, Entry } from '../../contexts/contest/contestTypes';

export interface EntrySummary {
  id: string;
  name: string | null;
  creatorName: string;
  contestantId: string;
  imageUrl?: string;
}

export interface VoteTotals {
  entryId: string;
  categoryId: string;
  total: number;
  userHasVoted: boolean;
}

export function buildEntrySummary(entry: Entry, contestant: Contestant | null): EntrySummary {
  return {
    id: entry.id,
    name: entry.name || null,
    creatorName: contestant?.displayName ?? 'Unknown',
    contestantId: entry.contestantId,
  };
}

export function buildEntrySummaries(
  entries: Entry[],
  contestantsById: Map<string, Contestant>,
): EntrySummary[] {
  return entries.map((entry) => buildEntrySummary(entry, contestantsById.get(entry.contestantId) ?? null));
}
