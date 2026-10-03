// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { chartedPattern, kingPatternList, parsePattern } from './pattern-codes';

describe('parsePattern', () => {
  it('reads riders and jumpers', () => {
    expect(parsePattern('R:8896')).toEqual({ kind: 'rider', steps: '8896' });
    expect(parsePattern('J:-1,7')).toEqual({ kind: 'jumper', dx: -1, dy: 7 });
  });

  it.each(['R:', 'R:85', 'J:0,1', 'J:1,1', 'J:0,8', 'J:a,2', 'X:88', 7, null])(
    'rejects %j',
    (code) => {
      expect(parsePattern(code)).toBeNull();
    },
  );
});

describe('chartedPattern', () => {
  it('keeps a clean path as a rider in charted orientation', () => {
    expect(chartedPattern('966', false)).toBe('R:966');
  });

  it('turns a path through a piece into a jumper on its net offset', () => {
    expect(chartedPattern('8888887', true)).toBe('J:-1,7');
  });

  it('folds a jump that ends one step away into a one-step rider', () => {
    // N, W, S: three distinct squares that end one step west of the start.
    expect(chartedPattern('842', true)).toBe('R:4');
    expect(chartedPattern('86', true)).toBe('R:9');
  });
});

describe('kingPatternList', () => {
  it('lists what each Tracer lends, in Tracer order', () => {
    const state = { kingPatterns: { w: { wT8: 'R:88', wT3: 'J:0,2' }, b: {} } };
    expect(kingPatternList(state, 'w')).toEqual(['J:0,2', 'R:88']);
    expect(kingPatternList(state, 'b')).toEqual([]);
  });
});
