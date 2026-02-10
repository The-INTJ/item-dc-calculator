import type { Contest, ScoreBreakdown } from '../../contexts/contest/contestTypes';
import { createEmptyBreakdown, getEffectiveConfig, validateBreakdown } from './validation';

export interface NormalizedScorePayload {
  breakdown: ScoreBreakdown;
}

export function normalizeScorePayload(options: {
  contest: Contest;
  baseBreakdown?: ScoreBreakdown;
  updates?: Partial<ScoreBreakdown>;
}): NormalizedScorePayload {
  const { contest, baseBreakdown, updates } = options;
  const config = getEffectiveConfig(contest);
  const breakdown: ScoreBreakdown = baseBreakdown
    ? { ...baseBreakdown }
    : { ...createEmptyBreakdown(config) };

  if (updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      breakdown[key] = value;
    }
  }

  const errors = validateBreakdown(breakdown, config);
  if (errors.length > 0) {
    throw new Error(`Validation: ${errors.join(' ')}`);
  }

  return { breakdown };
}
