// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { positionFrom } from './fixtures/position';
import { initialState } from './setup';
import { attackedSquares, isKingInDanger } from './threats';
import { hasLegalMainAction } from './legality';

describe('attackedSquares', () => {
  it('covers jumper images that sit next to each other', () => {
    // A (1,2) jumper on d3 hits e5 and f4, which are neighbours: a king on e5
    // that steps to f4 is still attacked, while e6 is safe.
    const state = positionFrom(
      `
      5 . . . . k . . .
      3 . . . T . . . .
      1 K . . . . . . .
      `,
      { patterns: { d3: 'J:1,2' } },
    );
    const attacked = attackedSquares(state, 'w');
    expect(attacked).toEqual(expect.arrayContaining(['e5', 'f4']));
    expect(attacked).not.toContain('e6');
    expect(isKingInDanger(state, 'b')).toBe(true);
  });

  it('includes lines a free step would open', () => {
    // The king on d2 blocks the rider; stepping aside first opens d5.
    const state = positionFrom(
      `
      8 . . . . . . . k
      5 . . . w . . . .
      2 . . . K . . . .
      1 . . . T . . . .
      `,
      { patterns: { d1: 'R:8888' } },
    );
    expect(attackedSquares(state, 'w')).toContain('d5');
  });

  it('never counts charts — an unformed tracer threatens nothing', () => {
    const state = positionFrom(`
      5 . . . . w . . k
      4 . . . T . . . .
      1 K . . . . . . .
    `);
    // Only the king's own neighbours are covered.
    expect(attackedSquares(state, 'w')).toEqual(['b1', 'a2', 'b2']);
  });

  it('does not let the king step and then strike', () => {
    // Kings two squares apart: the free step cannot come before a king move.
    const apart = positionFrom('3 . . . . k . . .\n1 . . . . K . . .');
    expect(isKingInDanger(apart, 'b')).toBe(false);
    const adjacent = positionFrom('2 . . . . k . . .\n1 . . . . K . . .');
    expect(isKingInDanger(adjacent, 'b')).toBe(true);
  });

  it('uses library patterns from the king’s current square', () => {
    const state = positionFrom('8 . . . . . . . k\n1 . . . . . . . K', { library: { w: ['R:8888888'] } });
    expect(attackedSquares(state, 'w')).toContain('h8');
  });
});

describe('hasLegalMainAction', () => {
  it('holds for both sides at the start', () => {
    expect(hasLegalMainAction(initialState(), 'w')).toBe(true);
    expect(hasLegalMainAction(initialState(), 'b')).toBe(true);
  });

  it('holds for a lone king hemmed in by enemies it can capture', () => {
    const state = positionFrom('2 w w . . . . . .\n1 K w . . . . . .');
    expect(hasLegalMainAction(state, 'w')).toBe(true);
  });
});
