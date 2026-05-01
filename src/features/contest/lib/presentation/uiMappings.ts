import type { Contestant, Entry } from '../../contexts/contest/contestTypes';
import { getMissingEntryQuip } from '../domain/entryLabels';

export interface EntrySummary {
  id: string;
  /** The contestant's chosen entry name when set; otherwise null. */
  name: string | null;
  /** Always populated — falls back to the teasing quip when name is missing. */
  displayName: string;
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
  const trimmed = entry.name?.trim() || null;
  const creatorName = contestant?.displayName ?? 'Unknown';
  return {
    id: entry.id,
    name: trimmed,
    displayName: trimmed ?? getMissingEntryQuip(contestant?.displayName ?? null),
    creatorName,
    contestantId: entry.contestantId,
  };
}

export function buildEntrySummaries(
  entries: Entry[],
  contestantsById: Map<string, Contestant>,
): EntrySummary[] {
  return entries.map((entry) => buildEntrySummary(entry, contestantsById.get(entry.contestantId) ?? null));
}
