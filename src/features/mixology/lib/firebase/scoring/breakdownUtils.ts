/**
 * Pure utility functions for ScoreBreakdown manipulation.
 *
 * These are intentionally framework-agnostic and can be tested in isolation.
 */

import type { ScoreBreakdown } from '../../globals/types';

/**
 * Creates an empty breakdown with all scores set to 0.
 */
export function createEmptyBreakdown(): ScoreBreakdown {
  return {
    aroma: 0,
    balance: 0,
    presentation: 0,
    creativity: 0,
    overall: 0,
  };
}

/**
 * Adds two breakdowns together, returning a new breakdown.
 * Handles dynamic keys—any key present in either breakdown is summed.
 */
export function addBreakdowns(base: ScoreBreakdown, delta: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(delta)]);
  for (const key of allKeys) {
    result[key] = (base[key] ?? 0) + (delta[key] ?? 0);
  }
  return result;
}

/**
 * Computes the difference between two breakdowns (next - prev).
 * Useful for calculating the delta when a score is updated.
 */
export function diffBreakdowns(next: ScoreBreakdown, prev: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  for (const key of allKeys) {
    result[key] = (next[key] ?? 0) - (prev[key] ?? 0);
  }
  return result;
}
