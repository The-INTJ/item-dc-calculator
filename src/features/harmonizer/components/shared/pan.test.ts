import { describe, expect, it } from 'vitest';
import { needsPan, panForUnit, panShiftPercent, trackScale, VISIBLE_NOTES } from './pan';

describe('needsPan / trackScale', () => {
  it('leaves four or fewer notes alone', () => {
    for (const count of [0, 1, 3, VISIBLE_NOTES]) {
      expect(needsPan(count)).toBe(false);
      expect(trackScale(count)).toBe(1);
    }
  });

  it('widens the track proportionally past four notes', () => {
    expect(needsPan(5)).toBe(true);
    expect(trackScale(8)).toBe(2);
    expect(trackScale(6)).toBe(1.5);
  });
});

describe('panShiftPercent', () => {
  it('is a no-op without scaling', () => {
    expect(panShiftPercent(0.5, 1)).toBe('0%');
  });

  it('shifts from zero to exactly the offscreen remainder', () => {
    // scale 2 → the track is twice the window, so one whole window's worth is
    // offscreen; percentages are relative to that window.
    expect(panShiftPercent(0, 2)).toBe('0%');
    expect(panShiftPercent(1, 2)).toBe('-100%');
    expect(panShiftPercent(0.5, 2)).toBe('-50%');
    expect(panShiftPercent(1, 1.25)).toBe('-25%');
  });

  it('clamps out-of-range pans instead of overscrolling', () => {
    expect(panShiftPercent(-3, 2)).toBe('0%');
    expect(panShiftPercent(9, 2)).toBe('-100%');
  });
});

describe('panForUnit', () => {
  it('centers the playback cursor in the window', () => {
    // 32 units, scale 2 → window covers half the track. Unit 17 (0-based 16)
    // is the midpoint, so the window should start a quarter in: pan 0.5.
    expect(panForUnit(17, 32, 2)).toBeCloseTo(0.5, 5);
  });

  it('pins to the ends rather than showing empty track', () => {
    expect(panForUnit(1, 32, 2)).toBe(0);
    expect(panForUnit(32, 32, 2)).toBe(1);
  });

  it('stays at zero when there is nothing to pan', () => {
    expect(panForUnit(9, 16, 1)).toBe(0);
    expect(panForUnit(9, 0, 2)).toBe(0);
  });
});
