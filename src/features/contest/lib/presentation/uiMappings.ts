import type { Entry } from '../../contexts/contest/contestTypes';

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

export function buildEntrySummary(entry: Entry): EntrySummary {
  return {
    id: entry.id,
    name: entry.name || null,
    creatorName: entry.submittedBy,
  };
}

export function buildEntrySummaries(entries: Entry[]): EntrySummary[] {
  return entries.map((entry) => buildEntrySummary(entry));
}
