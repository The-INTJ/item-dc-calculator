import type { ScoreBreakdown, ScoreEntry, ContestConfig } from '../types';
import type { UserVote } from './auth/types';
import { MIXOLOGY_CONFIG, getAttributeIds } from '../types';

/**
 * Default breakdown keys for backward compatibility (Mixology config).
 * @deprecated Use getAttributeIds(config) for dynamic configs.
 */
export const breakdownKeys: string[] = getAttributeIds(MIXOLOGY_CONFIG);

/**
 * Type guard to check if a string is a valid ScoreBreakdown key.
 * Without a config, falls back to Mixology defaults.
 */
export function isBreakdownKey(value: string, config?: ContestConfig): boolean {
  const validKeys = config ? getAttributeIds(config) : breakdownKeys;
  return validKeys.includes(value);
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
  categoryIds: string[],
  config?: ContestConfig
): Record<string, Record<string, number>> {
  return entries.reduce<Record<string, Record<string, number>>>((acc, entry) => {
    const entryId = entry.entryId ?? entry.drinkId;
    if (!entryId) return acc;
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId, config)) return;
      const value = entry.breakdown[categoryId];
      if (!Number.isFinite(value)) return;
      acc[entryId] = acc[entryId] ?? {};
      acc[entryId][categoryId] = value;
    });
    return acc;
  }, {});
}

/**
 * Converts UserVote array into a score map keyed by drinkId -> categoryId.
 */
export function buildScoresFromVotes(
  votes: UserVote[],
  categoryIds: string[],
  config?: ContestConfig
): Record<string, Record<string, number>> {
  return votes.reduce<Record<string, Record<string, number>>>((acc, vote) => {
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId, config)) return;
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
 * Uses the provided config or falls back to Mixology defaults.
 */
export function buildFullBreakdown(
  values: Partial<ScoreBreakdown>,
  config?: ContestConfig
): ScoreBreakdown {
  const keys = config ? getAttributeIds(config) : breakdownKeys;
  return keys.reduce<ScoreBreakdown>((acc, key) => {
    const value = values[key];
    acc[key] = value === null ? null : value ?? 0;
    return acc;
  }, {});
}

/**
 * Calculates a single score from breakdown values.
 * Returns `overall` if > 0, otherwise averages all valid scores.
 */
export function calculateScore(breakdown: ScoreBreakdown, config?: ContestConfig): number {
  // If overall exists and is > 0, use it
  if (typeof breakdown.overall === 'number' && breakdown.overall > 0) return breakdown.overall;

  const keys = config ? getAttributeIds(config) : Object.keys(breakdown);
  const scores = keys
    .map((key) => breakdown[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}
