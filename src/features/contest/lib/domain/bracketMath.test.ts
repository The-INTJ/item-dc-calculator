import { describe, it, expect } from 'vitest';
import {
  computeBracketStructure,
  getBracketGridRowCount,
  getMatchupGridPlacement,
  pairMatchupsAcrossRounds,
} from './bracketMath';

describe('computeBracketStructure', () => {
  it('returns empty structure for 0 rounds', () => {
    const result = computeBracketStructure(0);
    expect(result.totalRounds).toBe(0);
    expect(result.totalContestants).toBe(0);
    expect(result.rounds).toEqual([]);
  });

  it('computes 1 round: 2 contestants, 1 matchup', () => {
    const result = computeBracketStructure(1);
    expect(result.totalRounds).toBe(1);
    expect(result.totalContestants).toBe(2);
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].matchupCount).toBe(1);
    expect(result.rounds[0].slots[0].sourceMatchups).toBeNull();
  });

  it('computes 2 rounds: 4 contestants, [2, 1] matchups', () => {
    const result = computeBracketStructure(2);
    expect(result.totalRounds).toBe(2);
    expect(result.totalContestants).toBe(4);
    expect(result.rounds).toHaveLength(2);

    // Round 0: 2 matchups, no sources (seeded)
    expect(result.rounds[0].matchupCount).toBe(2);
    expect(result.rounds[0].slots[0].sourceMatchups).toBeNull();
    expect(result.rounds[0].slots[1].sourceMatchups).toBeNull();

    // Round 1: 1 matchup, sources from round 0 matchups [0, 1]
    expect(result.rounds[1].matchupCount).toBe(1);
    expect(result.rounds[1].slots[0].sourceMatchups).toEqual([0, 1]);
  });

  it('computes 3 rounds: 8 contestants, [4, 2, 1] matchups', () => {
    const result = computeBracketStructure(3);
    expect(result.totalRounds).toBe(3);
    expect(result.totalContestants).toBe(8);
    expect(result.rounds.map((r) => r.matchupCount)).toEqual([4, 2, 1]);

    // Round 0: all seeded
    for (const slot of result.rounds[0].slots) {
      expect(slot.sourceMatchups).toBeNull();
    }

    // Round 1: sources from round 0
    expect(result.rounds[1].slots[0].sourceMatchups).toEqual([0, 1]);
    expect(result.rounds[1].slots[1].sourceMatchups).toEqual([2, 3]);

    // Round 2 (final): sources from round 1
    expect(result.rounds[2].slots[0].sourceMatchups).toEqual([0, 1]);
  });

  it('handles negative rounds gracefully', () => {
    const result = computeBracketStructure(-1);
    expect(result.totalRounds).toBe(0);
    expect(result.rounds).toEqual([]);
  });
});

describe('getBracketGridRowCount', () => {
  it('returns 0 for no rounds', () => {
    expect(getBracketGridRowCount(0)).toBe(0);
  });

  it('returns 2 ** totalRounds for positive counts', () => {
    expect(getBracketGridRowCount(1)).toBe(2);
    expect(getBracketGridRowCount(2)).toBe(4);
    expect(getBracketGridRowCount(3)).toBe(8);
    expect(getBracketGridRowCount(4)).toBe(16);
  });
});

describe('getMatchupGridPlacement', () => {
  it('places round 0 matchups two rows each starting at row 1', () => {
    // 3 rounds, 4 matchups in round 0 → rows [1-2], [3-4], [5-6], [7-8]
    expect(getMatchupGridPlacement(0, 0)).toEqual({ rowStart: 1, rowSpan: 2 });
    expect(getMatchupGridPlacement(0, 1)).toEqual({ rowStart: 3, rowSpan: 2 });
    expect(getMatchupGridPlacement(0, 2)).toEqual({ rowStart: 5, rowSpan: 2 });
    expect(getMatchupGridPlacement(0, 3)).toEqual({ rowStart: 7, rowSpan: 2 });
  });

  it('places round 1 matchups centered between their two feeders', () => {
    // Round 1 slot 0 spans rows 1-4 (centered on the boundary of feeders in rows 1-2 and 3-4)
    expect(getMatchupGridPlacement(1, 0)).toEqual({ rowStart: 1, rowSpan: 4 });
    expect(getMatchupGridPlacement(1, 1)).toEqual({ rowStart: 5, rowSpan: 4 });
  });

  it('places the final round matchup across the full bracket height', () => {
    // 3-round bracket: final spans 8 rows
    expect(getMatchupGridPlacement(2, 0)).toEqual({ rowStart: 1, rowSpan: 8 });
    // 4-round bracket: final spans 16 rows
    expect(getMatchupGridPlacement(3, 0)).toEqual({ rowStart: 1, rowSpan: 16 });
  });
});

describe('pairMatchupsAcrossRounds', () => {
  it('pairs slots 2k and 2k+1 into slot k of the next round', () => {
    const from = [
      { id: 'a', slotIndex: 0 },
      { id: 'b', slotIndex: 1 },
      { id: 'c', slotIndex: 2 },
      { id: 'd', slotIndex: 3 },
    ];
    const to = [
      { id: 'x', slotIndex: 0 },
      { id: 'y', slotIndex: 1 },
    ];
    const pairs = pairMatchupsAcrossRounds(from, to);
    expect(pairs.get('a')).toEqual({ advancesToMatchupId: 'x', advancesToSlot: 0 });
    expect(pairs.get('b')).toEqual({ advancesToMatchupId: 'x', advancesToSlot: 1 });
    expect(pairs.get('c')).toEqual({ advancesToMatchupId: 'y', advancesToSlot: 0 });
    expect(pairs.get('d')).toEqual({ advancesToMatchupId: 'y', advancesToSlot: 1 });
  });

  it('skips sources whose target slot is missing', () => {
    const from = [{ id: 'a', slotIndex: 0 }];
    const to: { id: string; slotIndex: number }[] = [];
    const pairs = pairMatchupsAcrossRounds(from, to);
    expect(pairs.size).toBe(0);
  });
});
