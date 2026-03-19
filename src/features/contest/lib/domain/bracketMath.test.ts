import { describe, it, expect } from 'vitest';
import { computeBracketStructure } from './bracketMath';

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
