import { describe, it, expect } from 'vitest';
import type { BracketRound } from '../../components/ui/BracketView';
import { buildBracketLayout } from './bracketLayout';

function makeRound(id: string, name: string): BracketRound {
  return { id, name, status: 'upcoming', matchups: [] };
}

describe('buildBracketLayout', () => {
  it('returns face-off with null finalRound for empty rounds', () => {
    const layout = buildBracketLayout([]);
    expect(layout.kind).toBe('face-off');
    expect(layout.finalRound).toBeNull();
    expect(layout.rounds).toEqual([]);
  });

  it('returns face-off for a single round', () => {
    const round = makeRound('r1', 'Round 1');
    const layout = buildBracketLayout([round]);
    expect(layout.kind).toBe('face-off');
    expect(layout.finalRound).toBe(round);
    expect(layout.rounds).toHaveLength(1);
  });

  it('returns bracket for two rounds', () => {
    const rounds = [makeRound('r1', 'Round 1'), makeRound('r2', 'Round 2')];
    const layout = buildBracketLayout(rounds);
    expect(layout.kind).toBe('bracket');
    expect(layout.finalRound).toBeNull();
    expect(layout.rounds).toHaveLength(2);
  });

  it('returns bracket for many rounds', () => {
    const rounds = [
      makeRound('r1', 'Round 1'),
      makeRound('r2', 'Round 2'),
      makeRound('r3', 'Round 3'),
      makeRound('r4', 'Round 4'),
    ];
    const layout = buildBracketLayout(rounds);
    expect(layout.kind).toBe('bracket');
    expect(layout.finalRound).toBeNull();
    expect(layout.rounds).toHaveLength(4);
  });
});
