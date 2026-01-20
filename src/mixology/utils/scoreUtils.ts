import type { ScoreBreakdown, ScoreEntry } from '../types';
import type { UserVote } from '../auth/types';

/**
 * Ordered list of breakdown score keys.
 */
export const breakdownKeys: Array<keyof ScoreBreakdown> = [
  'aroma',
  'balance',
  'presentation',
  'creativity',
  'overall',
];

const breakdownKeySet = new Set<string>(breakdownKeys);

/**
 * Type guard to check if a string is a valid ScoreBreakdown key.
 */
export function isBreakdownKey(value: string): value is keyof ScoreBreakdown {
  return breakdownKeySet.has(value);
}

/**
 * Creates a score map with default values for each drink/category combination.
 */
export function buildScoreDefaults(
  drinkIds: string[],
  categoryIds: string[],
  defaultValue = 5
): Record<string, Record<string, number>> {
  return drinkIds.reduce<Record<string, Record<string, number>>>((acc, drinkId) => {
    acc[drinkId] = categoryIds.reduce<Record<string, number>>((categoriesAcc, categoryId) => {
      categoriesAcc[categoryId] = defaultValue;
      return categoriesAcc;
    }, {});
    return acc;
  }, {});
}

/**
 * Merges two score maps, with overrides taking precedence.
 */
export function mergeScoreMaps(
  base: Record<string, Record<string, number>>,
  overrides: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const merged: Record<string, Record<string, number>> = { ...base };
  Object.entries(overrides).forEach(([drinkId, scores]) => {
    merged[drinkId] = { ...(merged[drinkId] ?? {}), ...scores };
  });
  return merged;
}

/**
 * Converts ScoreEntry array into a score map keyed by drinkId -> categoryId.
 */
export function buildScoresFromEntries(
  entries: ScoreEntry[],
  categoryIds: string[]
): Record<string, Record<string, number>> {
  return entries.reduce<Record<string, Record<string, number>>>((acc, entry) => {
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId)) return;
      const value = entry.breakdown[categoryId];
      if (!Number.isFinite(value)) return;
      acc[entry.drinkId] = acc[entry.drinkId] ?? {};
      acc[entry.drinkId][categoryId] = value;
    });
    return acc;
  }, {});
}

/**
 * Converts UserVote array into a score map keyed by drinkId -> categoryId.
 */
export function buildScoresFromVotes(
  votes: UserVote[],
  categoryIds: string[]
): Record<string, Record<string, number>> {
  return votes.reduce<Record<string, Record<string, number>>>((acc, vote) => {
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId)) return;
      const value = vote.breakdown?.[categoryId];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      acc[vote.drinkId] = acc[vote.drinkId] ?? {};
      acc[vote.drinkId][categoryId] = value;
    });
    return acc;
  }, {});
}

/**
 * Ensures all breakdown keys exist with a value (defaults to 0).
 */
export function buildFullBreakdown(values: Partial<ScoreBreakdown>): ScoreBreakdown {
  return breakdownKeys.reduce<ScoreBreakdown>((acc, key) => {
    acc[key] = values[key] ?? 0;
    return acc;
  }, {} as ScoreBreakdown);
}

/**
 * Calculates a single score from breakdown values.
 * Returns `overall` if > 0, otherwise averages all valid scores.
 */
export function calculateScore(breakdown: ScoreBreakdown): number {
  if (breakdown.overall > 0) return breakdown.overall;

  const scores = breakdownKeys
    .map((key) => breakdown[key])
    .filter((value) => Number.isFinite(value));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}
