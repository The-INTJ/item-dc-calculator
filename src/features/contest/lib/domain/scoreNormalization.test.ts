import { describe, expect, it } from 'vitest';
import { normalizeScorePayload } from './scoreNormalization';
import type { Contest, ContestConfig } from '../../contexts/contest/contestTypes';

const config: ContestConfig = {
  topic: 'Mixology',
  attributes: [
    { id: 'taste', label: 'Taste', min: 1, max: 10 },
    { id: 'aroma', label: 'Aroma', min: 0, max: 10 },
  ],
};

function contestWith(configOverride: ContestConfig = config): Contest {
  return {
    id: 'contest-1',
    name: 'Test',
    slug: 'test',
    config: configOverride,
    contestants: [],
    voters: [],
  };
}

describe('normalizeScorePayload', () => {
  it('accepts a complete in-range breakdown', () => {
    const result = normalizeScorePayload({
      contest: contestWith(),
      updates: { taste: 8, aroma: 6 },
    });
    expect(result.breakdown).toEqual({ taste: 8, aroma: 6 });
  });

  it('merges updates onto a base breakdown (existing vote)', () => {
    const result = normalizeScorePayload({
      contest: contestWith(),
      baseBreakdown: { taste: 8, aroma: 6 },
      updates: { aroma: 9 },
    });
    expect(result.breakdown).toEqual({ taste: 8, aroma: 9 });
  });

  it('rejects out-of-range values', () => {
    expect(() =>
      normalizeScorePayload({
        contest: contestWith(),
        updates: { taste: 11, aroma: 6 },
      }),
    ).toThrow(/taste: must be between 1 and 10/);
  });

  it('rejects unknown attributes', () => {
    expect(() =>
      normalizeScorePayload({
        contest: contestWith(),
        updates: { taste: 8, aroma: 6, sparkle: 5 },
      }),
    ).toThrow(/unknown attribute: sparkle/);
  });

  it('rejects a partial first vote when a min > 0 attribute would be zero-filled', () => {
    // With no base breakdown, missing attributes are zero-filled; taste has
    // min 1, so a first vote must cover every attribute.
    expect(() =>
      normalizeScorePayload({
        contest: contestWith(),
        updates: { aroma: 6 },
      }),
    ).toThrow(/taste: must be between 1 and 10/);
  });

  it('rejects non-numeric values', () => {
    expect(() =>
      normalizeScorePayload({
        contest: contestWith(),
        updates: { taste: Number.NaN, aroma: 6 },
      }),
    ).toThrow(/taste: must be a number/);
  });

  it('throws when the contest has no config', () => {
    const contest = { ...contestWith(), config: undefined };
    expect(() => normalizeScorePayload({ contest, updates: { taste: 5 } })).toThrow(
      /missing required config/,
    );
  });
});
