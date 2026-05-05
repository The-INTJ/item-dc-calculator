import { describe, expect, it } from 'vitest';
import type { ContestConfig } from '../../../contexts/contest/contestTypes';
import { buildAutoVoteScores, buildSelfMaxVote } from '../autoVote';

function config(attrs: Array<{ id: string; min?: number; max?: number }>): ContestConfig {
  return {
    topic: 'Test',
    attributes: attrs.map((a) => ({
      id: a.id,
      label: a.id,
      min: a.min ?? 0,
      max: a.max ?? 10,
    })),
  };
}

describe('buildAutoVoteScores (midpoint for skipped entries)', () => {
  it('returns empty when every entry was scored', () => {
    const result = buildAutoVoteScores(['e1', 'e2'], ['e1', 'e2'], config([{ id: 'taste' }]));
    expect(result).toEqual([]);
  });

  it('builds midpoint scores for unscored entries', () => {
    const result = buildAutoVoteScores(
      ['e1', 'e2', 'e3'],
      ['e1'],
      config([{ id: 'taste' }, { id: 'aroma' }]),
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.entryId).sort()).toEqual(['e2', 'e3']);
    for (const r of result) {
      expect(r.breakdown).toEqual({ taste: 5, aroma: 5 });
    }
  });

  it('respects custom min/max when computing midpoint', () => {
    const result = buildAutoVoteScores(
      ['e1'],
      [],
      config([{ id: 'taste', min: 2, max: 8 }]),
    );
    expect(result).toEqual([{ entryId: 'e1', breakdown: { taste: 5 } }]);
  });
});

describe('buildSelfMaxVote (max for the contestant on their own entry)', () => {
  it('returns empty when there is no self entry', () => {
    expect(buildSelfMaxVote(null, config([{ id: 'taste' }]))).toEqual([]);
  });

  it('builds a max-score vote for the self entry across all categories', () => {
    const result = buildSelfMaxVote(
      'self-e',
      config([{ id: 'taste' }, { id: 'aroma' }]),
    );
    expect(result).toEqual([
      { entryId: 'self-e', breakdown: { taste: 10, aroma: 10 } },
    ]);
  });

  it('uses the per-category max', () => {
    const result = buildSelfMaxVote('self-e', config([{ id: 'taste', max: 7 }]));
    expect(result[0].breakdown).toEqual({ taste: 7 });
  });
});
