import { describe, it, expect } from 'vitest';
import {
  computeBracketShape,
  computeBracketStructure,
  computeBracketStructureFromShape,
  getBracketGridRowCount,
  getBracketGridRowCountForShape,
  getMatchupGridPlacement,
  getRequiredRoundCount,
  pairMatchupsAcrossRounds,
  pairWithByes,
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

describe('computeBracketShape', () => {
  it('cascades ceil(n/2) from the first-round matchup count', () => {
    expect(computeBracketShape(3, 3)).toEqual([3, 2, 1]);
    expect(computeBracketShape(2, 2)).toEqual([2, 1]);
    expect(computeBracketShape(4, 3)).toEqual([4, 2, 1]);
    expect(computeBracketShape(6, 4)).toEqual([6, 3, 2, 1]);
  });

  it('keeps trailing rounds at 1 once the cascade converges', () => {
    // 4 contestants (2 matchups) with a surplus third round → [2, 1, 1].
    expect(computeBracketShape(2, 3)).toEqual([2, 1, 1]);
  });

  it('propagates zero for unseeded shapes', () => {
    expect(computeBracketShape(0, 2)).toEqual([0, 0]);
  });

  it('returns empty for zero rounds', () => {
    expect(computeBracketShape(3, 0)).toEqual([]);
  });
});

describe('computeBracketStructureFromShape', () => {
  it('filters phantom feeders for odd shapes', () => {
    // Shape [3, 2, 1] — round-1 slot 1 is fed only by round-0 slot 2 (the bye).
    const structure = computeBracketStructureFromShape([3, 2, 1]);
    expect(structure.rounds.map((r) => r.matchupCount)).toEqual([3, 2, 1]);
    expect(structure.rounds[1].slots[0].sourceMatchups).toEqual([0, 1]);
    expect(structure.rounds[1].slots[1].sourceMatchups).toEqual([2]);
    expect(structure.rounds[2].slots[0].sourceMatchups).toEqual([0, 1]);
  });

  it('handles single-feeder trailing rounds', () => {
    // Shape [2, 1, 1] — the surplus final is fed by the lone round-1 matchup.
    const structure = computeBracketStructureFromShape([2, 1, 1]);
    expect(structure.rounds[2].slots[0].sourceMatchups).toEqual([0]);
  });

  it('matches the power-of-2 structure for power-of-2 shapes', () => {
    const fromShape = computeBracketStructureFromShape([4, 2, 1]);
    const classic = computeBracketStructure(3);
    expect(fromShape.rounds.map((r) => r.matchupCount)).toEqual(
      classic.rounds.map((r) => r.matchupCount),
    );
    expect(fromShape.rounds[1].slots[1].sourceMatchups).toEqual([2, 3]);
  });

  it('round 0 has no sources', () => {
    const structure = computeBracketStructureFromShape([3, 2, 1]);
    for (const slot of structure.rounds[0].slots) {
      expect(slot.sourceMatchups).toBeNull();
    }
  });
});

describe('getBracketGridRowCountForShape', () => {
  it('gives every slot at least its two-row footprint', () => {
    expect(getBracketGridRowCountForShape([1])).toBe(2);
    expect(getBracketGridRowCountForShape([2, 1])).toBe(4);
    expect(getBracketGridRowCountForShape([3, 2, 1])).toBe(6);
    expect(getBracketGridRowCountForShape([6, 3, 2, 1])).toBe(12);
  });

  it('matches 2^n for power-of-2 shapes', () => {
    expect(getBracketGridRowCountForShape([4, 2, 1])).toBe(8);
    expect(getBracketGridRowCountForShape([8, 4, 2, 1])).toBe(16);
  });

  it('returns 0 for empty shapes', () => {
    expect(getBracketGridRowCountForShape([])).toBe(0);
    expect(getBracketGridRowCountForShape([0, 0])).toBe(0);
  });
});

describe('getMatchupGridPlacement with grid clamping', () => {
  it('clamps over-capacity slots to the grid (the 5-contestant bug case)', () => {
    // Shape [3, 2] → 6-row grid. Round-0 slot 2 was previously placed at
    // rows 5-6 of a 4-row grid (off-grid); with the derived 6-row grid it fits.
    const grid = getBracketGridRowCountForShape([3, 2]);
    expect(grid).toBe(6);
    expect(getMatchupGridPlacement(0, 2, grid)).toEqual({ rowStart: 5, rowSpan: 2 });
    // Round-1 slot 1 (fed only by the bye) clamps its 4-row span to the grid.
    expect(getMatchupGridPlacement(1, 1, grid)).toEqual({ rowStart: 5, rowSpan: 2 });
  });

  it('clamps a surplus final to the full grid height', () => {
    // Shape [2, 1, 1] → 4-row grid; the final's natural 8-row span clamps to 4.
    expect(getMatchupGridPlacement(2, 0, 4)).toEqual({ rowStart: 1, rowSpan: 4 });
  });

  it('preserves legacy behavior when no grid bound is passed', () => {
    expect(getMatchupGridPlacement(1, 1)).toEqual({ rowStart: 5, rowSpan: 4 });
  });
});

describe('getRequiredRoundCount', () => {
  it('computes ceil(log2(n)) rounds to crown a champion', () => {
    expect(getRequiredRoundCount(2)).toBe(1);
    expect(getRequiredRoundCount(3)).toBe(2);
    expect(getRequiredRoundCount(4)).toBe(2);
    expect(getRequiredRoundCount(5)).toBe(3);
    expect(getRequiredRoundCount(7)).toBe(3);
    expect(getRequiredRoundCount(8)).toBe(3);
    expect(getRequiredRoundCount(9)).toBe(4);
    expect(getRequiredRoundCount(12)).toBe(4);
    expect(getRequiredRoundCount(16)).toBe(4);
  });

  it('returns 0 when there is nothing to bracket', () => {
    expect(getRequiredRoundCount(0)).toBe(0);
    expect(getRequiredRoundCount(1)).toBe(0);
  });
});

describe('pairWithByes', () => {
  it('pairs evenly when count is even', () => {
    const result = pairWithByes(['a', 'b', 'c', 'd']);
    expect(result.pairs).toEqual([['a', 'b'], ['c', 'd']]);
    expect(result.byeId).toBeNull();
  });

  it('gives the last entry a bye when count is odd', () => {
    const result = pairWithByes(['a', 'b', 'c']);
    expect(result.pairs).toEqual([['a', 'b']]);
    expect(result.byeId).toBe('c');
  });

  it('handles a single entry as a pure bye', () => {
    const result = pairWithByes(['a']);
    expect(result.pairs).toEqual([]);
    expect(result.byeId).toBe('a');
  });

  it('returns no pairs and no bye for an empty list', () => {
    const result = pairWithByes([]);
    expect(result.pairs).toEqual([]);
    expect(result.byeId).toBeNull();
  });
});
