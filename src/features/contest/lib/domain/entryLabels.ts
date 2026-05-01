import type { Contestant, Entry } from '../../contexts/contest/contestTypes';

/**
 * Teasing placeholder shown wherever an entry's name is missing during voting
 * (e.g., the contestant hasn't named their drink yet but the matchup is live).
 * Embedding the contestant's display name nudges them — and the audience —
 * without blocking the round from starting.
 */
export function getMissingEntryQuip(contestantName: string | null): string {
  const name = contestantName?.trim() || 'This contestant';
  return `${name} must not be creative — there's no drink name yet!`;
}

/**
 * Resolve the user-facing name for an entry. Returns the contestant's drink
 * name when set, otherwise the teasing quip embedding the contestant's name.
 * Returns null only when the entry slot itself is empty (TBD).
 */
export function getEntryDisplayName(
  entry: Entry | null | undefined,
  contestant: Contestant | null | undefined,
): string | null {
  const drink = entry?.name?.trim();
  if (drink) return drink;
  if (!entry) return null;
  return getMissingEntryQuip(contestant?.displayName ?? null);
}
