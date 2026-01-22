/**
 * Validation helpers for ContestConfig and dynamic ScoreBreakdown.
 */

import type { ContestConfig, ScoreBreakdown } from './types';
import { MIXOLOGY_CONFIG } from './templates';

/**
 * Get attribute IDs from a config.
 */
export function getAttributeIds(config: ContestConfig): string[] {
  return config.attributes.map((attr) => attr.id);
}

/**
 * Check if a key is a valid attribute ID for the given config.
 */
export function isValidAttributeId(key: string, config: ContestConfig): boolean {
  return config.attributes.some((attr) => attr.id === key);
}

/**
 * Create an empty breakdown with all attributes set to 0.
 */
export function createEmptyBreakdown(config: ContestConfig): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    breakdown[attr.id] = 0;
  }
  return breakdown;
}

/**
 * Validate a score breakdown against a config.
 * Returns an array of error messages (empty if valid).
 */
export function validateBreakdown(
  breakdown: unknown,
  config: ContestConfig,
  naSections: string[] = []
): string[] {
  const errors: string[] = [];

  if (!breakdown || typeof breakdown !== 'object') {
    return ['breakdown must be an object'];
  }

  const b = breakdown as Record<string, unknown>;
  const validIds = new Set(config.attributes.map((a) => a.id));
  const naSectionSet = new Set(naSections);

  // Check required attributes
  for (const attr of config.attributes) {
    if (naSectionSet.has(attr.id)) {
      if (attr.id in b) {
        const value = b[attr.id];
        if (value !== null && value !== undefined) {
          errors.push(`${attr.id}: cannot score a section marked N/A`);
        }
      }
      continue;
    }

    if (!(attr.id in b)) {
      errors.push(`missing attribute: ${attr.id}`);
    } else {
      const value = b[attr.id];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`${attr.id}: must be a number`);
      } else {
        const min = attr.min ?? 0;
        const max = attr.max ?? 10;
        if (value < min || value > max) {
          errors.push(`${attr.id}: must be between ${min} and ${max}`);
        }
      }
    }
  }

  // Check for unknown attributes
  for (const key of Object.keys(b)) {
    if (!validIds.has(key)) {
      errors.push(`unknown attribute: ${key}`);
    }
  }

  return errors;
}

/**
 * Get the effective config for a contest, falling back to Mixology default.
 */
export function getEffectiveConfig(contest: { config?: ContestConfig }): ContestConfig {
  return contest.config ?? MIXOLOGY_CONFIG;
}
