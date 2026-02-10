import type { ScoreBreakdown, ScoreEntry, ContestConfig } from '../../contexts/contest/contestTypes';
import { getAttributeIds } from './validation';

export function isBreakdownKey(value: string, config?: ContestConfig): boolean {
  if (!config) return true;
  return getAttributeIds(config).includes(value);
}

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

export function buildScoresFromEntries(
  entries: ScoreEntry[],
  categoryIds: string[],
  config?: ContestConfig
): Record<string, Record<string, number>> {
  return entries?.reduce<Record<string, Record<string, number>>>((acc, entry) => {
    const entryId = entry.entryId;
    if (!entryId) return acc;
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId, config)) return;
      const value = entry.breakdown[categoryId];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      acc[entryId] = acc[entryId] ?? {};
      acc[entryId][categoryId] = value;
    });
    return acc;
  }, {});
}

export function buildFullBreakdown(
  values: Partial<ScoreBreakdown>,
  config: ContestConfig
): ScoreBreakdown {
  const keys = getAttributeIds(config);
  return keys.reduce<ScoreBreakdown>((acc, key) => {
    acc[key] = values[key] ?? 0;
    return acc;
  }, {});
}

/**
 * Calculates a single score from breakdown values.
 * Uses a positive `overall` override; otherwise averages numeric attributes.
 */
export function calculateScore(breakdown: ScoreBreakdown, config?: ContestConfig): number {
  if (typeof breakdown.overall === 'number' && breakdown.overall > 0) return breakdown.overall;

  const keys = config ? getAttributeIds(config) : Object.keys(breakdown);
  const scores = keys
    .map((key) => breakdown[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (scores.length === 0) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}
