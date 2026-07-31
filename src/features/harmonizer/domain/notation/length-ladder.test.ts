import { describe, expect, it } from 'vitest';
import { LENGTH_LADDER, ladderIndexFor, stepLength } from './length-ladder';

describe('the length ladder', () => {
  it('climbs the lengths notation can draw with one symbol', () => {
    expect(LENGTH_LADDER).toEqual([1, 2, 3, 4, 6, 8, 12, 16]);
  });

  it('steps a note longer and shorter one written value at a time', () => {
    expect(stepLength(4, 1)).toBe(6); // quarter → dotted quarter
    expect(stepLength(4, 2)).toBe(8); // quarter → half
    expect(stepLength(4, -1)).toBe(3); // quarter → dotted eighth
    expect(stepLength(4, -2)).toBe(2); // quarter → eighth
  });

  it('runs out rather than repeating itself at either end', () => {
    expect(stepLength(16, 1)).toBeNull();
    expect(stepLength(12, 2)).toBeNull();
    expect(stepLength(1, -1)).toBeNull();
    expect(stepLength(2, -2)).toBeNull();
  });

  it('stays put for no step', () => {
    for (const units of LENGTH_LADDER) {
      expect(stepLength(units, 0)).toBe(units);
    }
  });

  it('rounds a length that sits between rungs up to the longer one', () => {
    // Five sixteenths is a quarter tied to a sixteenth — reachable by dragging,
    // never offered as a choice. Touching it should not silently shorten it.
    expect(ladderIndexFor(5)).toBe(LENGTH_LADDER.indexOf(6));
    expect(ladderIndexFor(7)).toBe(LENGTH_LADDER.indexOf(8));
    expect(ladderIndexFor(14)).toBe(LENGTH_LADDER.indexOf(16));
  });

  it('finds the nearest rung for anything reachable by dragging', () => {
    for (let units = 1; units <= 16; units += 1) {
      const index = ladderIndexFor(units);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(LENGTH_LADDER.length);
    }
  });
});
