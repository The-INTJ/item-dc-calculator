import type { Contest, ScoreBreakdown } from '../globals';
import { createEmptyBreakdown, getEffectiveConfig, isValidAttributeId, validateBreakdown } from '../globals';

export interface NormalizedScorePayload {
  breakdown: ScoreBreakdown;
  naSections?: string[];
}

function normalizeNaSections(contest: Contest, naSections?: string[]): string[] {
  if (!naSections) return [];
  const config = getEffectiveConfig(contest);
  const normalized = naSections
    .map((section) => section.trim())
    .filter(Boolean);

  for (const section of normalized) {
    if (!isValidAttributeId(section, config)) {
      throw new Error(`Validation: Invalid N/A section: ${section}.`);
    }
  }

  return Array.from(new Set(normalized));
}

export function normalizeScorePayload(options: {
  contest: Contest;
  baseBreakdown?: ScoreBreakdown;
  updates?: Partial<ScoreBreakdown>;
  naSections?: string[];
}): NormalizedScorePayload {
  const { contest, baseBreakdown, updates, naSections } = options;
  const config = getEffectiveConfig(contest);
  const normalizedNaSections = normalizeNaSections(contest, naSections);
  const breakdown: ScoreBreakdown = baseBreakdown
    ? { ...baseBreakdown }
    : { ...createEmptyBreakdown(config) };

  for (const section of normalizedNaSections) {
    breakdown[section] = null;
  }

  if (updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      breakdown[key] = value;
    }
  }

  const errors = validateBreakdown(breakdown, config, normalizedNaSections);
  if (errors.length > 0) {
    throw new Error(`Validation: ${errors.join(' ')}`);
  }

  return {
    breakdown,
    naSections: normalizedNaSections.length > 0 ? normalizedNaSections : undefined,
  };
}
