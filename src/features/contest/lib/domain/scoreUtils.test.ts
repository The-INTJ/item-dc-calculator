import { describe, expect, it } from 'vitest';
import type { ContestConfig, ScoreEntry } from '../../contexts/contest/contestTypes';
import {
  buildFullBreakdown,
  buildScoresFromEntries,
  calculateScore,
} from './scoreUtils';

const config: ContestConfig = {
  topic: 'Dessert',
  attributes: [
    { id: 'taste', label: 'Taste' },
    { id: 'texture', label: 'Texture' },
    { id: 'overall', label: 'Overall' },
  ],
};

describe('scoreUtils', () => {
  it('builds a full breakdown from partial values', () => {
    expect(buildFullBreakdown({ taste: 8 }, config)).toEqual({
      taste: 8,
      texture: 0,
      overall: 0,
    });
  });

  it('maps score entries into entry/category records while honoring config ids', () => {
    const entries: ScoreEntry[] = [
      {
        id: 'score-1',
        entryId: 'entry-1',
        userId: 'user-1',
        round: 'round-1',
        breakdown: { taste: 7, texture: 8, mystery: 9 },
      },
    ];

    expect(buildScoresFromEntries(entries, ['taste', 'texture', 'mystery'], config)).toEqual({
      'entry-1': {
        taste: 7,
        texture: 8,
      },
    });
  });

  it('prefers overall scores and otherwise averages numeric attributes', () => {
    expect(calculateScore({ taste: 6, texture: 8, overall: 9 }, config)).toBe(9);
    expect(calculateScore({ taste: 6, texture: 8 }, config)).toBe(7);
  });
});
