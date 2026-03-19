import { describe, it, expect } from 'vitest';
import type { ContestConfig } from '../../contexts/contest/contestTypes';
import { buildAutoVoteScores } from './autoVote';

const config: ContestConfig = {
  topic: 'Mixology',
  attributes: [
    { id: 'aroma', label: 'Aroma', min: 0, max: 10 },
    { id: 'balance', label: 'Balance', min: 0, max: 10 },
  ],
};

describe('buildAutoVoteScores', () => {
  it('returns empty when all entries are scored', () => {
    const result = buildAutoVoteScores(['e1', 'e2'], ['e1', 'e2'], config);
    expect(result).toEqual([]);
  });

  it('returns midpoint scores for unscored entries', () => {
    const result = buildAutoVoteScores(['e1', 'e2'], ['e1'], config);
    expect(result).toHaveLength(1);
    expect(result[0].entryId).toBe('e2');
    expect(result[0].breakdown).toEqual({ aroma: 5, balance: 5 });
  });

  it('respects custom min/max for midpoint calculation', () => {
    const customConfig: ContestConfig = {
      topic: 'Test',
      attributes: [
        { id: 'heat', label: 'Heat', min: 2, max: 8 },
      ],
    };
    const result = buildAutoVoteScores(['e1'], [], customConfig);
    expect(result[0].breakdown).toEqual({ heat: 5 });
  });

  it('defaults min=0 and max=10 when not specified', () => {
    const noRangeConfig: ContestConfig = {
      topic: 'Test',
      attributes: [{ id: 'overall', label: 'Overall' }],
    };
    const result = buildAutoVoteScores(['e1'], [], noRangeConfig);
    expect(result[0].breakdown).toEqual({ overall: 5 });
  });
});
