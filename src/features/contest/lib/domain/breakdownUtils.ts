import type { ScoreBreakdown } from '../../contexts/contest/contestTypes';

export function createEmptyBreakdown(attributeIds: string[]): ScoreBreakdown {
  return attributeIds.reduce<ScoreBreakdown>((acc, attributeId) => {
    acc[attributeId] = 0;
    return acc;
  }, {});
}

export function addBreakdowns(base: ScoreBreakdown, delta: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(delta)]);

  for (const key of allKeys) {
    result[key] = (base[key] ?? 0) + (delta[key] ?? 0);
  }

  return result;
}

export function diffBreakdowns(next: ScoreBreakdown, prev: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(next), ...Object.keys(prev)]);

  for (const key of allKeys) {
    result[key] = (next[key] ?? 0) - (prev[key] ?? 0);
  }

  return result;
}
