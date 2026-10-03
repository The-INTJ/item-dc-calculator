// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { chartedPattern, libraryKey, parsePattern } from './pattern-codes';

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

describe('libraryKey', () => {
  it('keys riders by their largest orientation', () => {
    expect(libraryKey('R:221')).toBe('R:889');
    expect(libraryKey('R:966')).toBe('R:988');
    expect(libraryKey('R:2')).toBe('R:8');
  });

  it('keeps step order significant', () => {
    expect(libraryKey('R:89')).not.toBe(libraryKey('R:98'));
  });

  it('keys jumpers by their sorted absolute offset', () => {
    expect(libraryKey('J:-2,1')).toBe('J:1,2');
    expect(libraryKey('J:0,-3')).toBe('J:0,3');
    expect(libraryKey('J:-1,7')).toBe('J:1,7');
  });

  it('never merges a rider with a jumper', () => {
    expect(libraryKey('R:88')).not.toBe(libraryKey('J:0,2'));
  });
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
