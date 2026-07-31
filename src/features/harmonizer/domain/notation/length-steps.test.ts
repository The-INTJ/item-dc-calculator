import { describe, expect, it } from 'vitest';
import { UNITS_PER_MEASURE } from '../timing';
import { stepUnits } from './length-steps';

describe('stepUnits', () => {
  it('moves one sixteenth at a time', () => {
    expect(stepUnits(4, 1)).toBe(5);
    expect(stepUnits(4, -1)).toBe(3);
    expect(stepUnits(4, 3)).toBe(7);
  });

  it('reaches lengths that have no symbol of their own', () => {
    // Five and seven sixteenths are written tied. The grid still offers them:
    // they are ordinary lengths, not gaps.
    expect(stepUnits(4, 1)).toBe(5);
    expect(stepUnits(8, -1)).toBe(7);
  });

  it('stops at a sixteenth', () => {
    expect(stepUnits(1, -1)).toBeNull();
    expect(stepUnits(2, -3)).toBeNull();
  });

  it('stops at a full measure', () => {
    expect(stepUnits(UNITS_PER_MEASURE, 1)).toBeNull();
    expect(stepUnits(UNITS_PER_MEASURE - 1, 3)).toBeNull();
    expect(stepUnits(UNITS_PER_MEASURE - 1, 1)).toBe(UNITS_PER_MEASURE);
  });

  it('stays put when asked for no step', () => {
    expect(stepUnits(6, 0)).toBe(6);
  });
});
