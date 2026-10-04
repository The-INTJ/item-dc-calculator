// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { canonicalKey, chartedPattern, parsePattern } from './pattern-codes';

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

describe('canonicalKey', () => {
  it('gives every rotation and mirror image of a pattern one key', () => {
    const images = ['R:966', 'R:322', 'R:144', 'R:788', 'R:744', 'R:988', 'R:366', 'R:122'];
    expect(new Set(images.map(canonicalKey))).toEqual(new Set(['R:988']));
    expect(['J:-1,7', 'J:7,1', 'J:1,-7', 'J:-7,-1'].map(canonicalKey)).toEqual(Array(4).fill('J:1,7'));
  });

  it('keeps different shapes apart', () => {
    expect(canonicalKey('R:966')).not.toBe(canonicalKey('R:996'));
    expect(canonicalKey('J:1,2')).not.toBe(canonicalKey('J:2,2'));
  });
});
