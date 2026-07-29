import { describe, expect, it } from 'vitest';
import { UNITS_PER_BEAT } from '../../domain/timing';
import { needsPan, panForUnit, panShiftPercent, trackScale, VISIBLE_BEATS } from './pan';

const beats = (count: number) => count * UNITS_PER_BEAT;

describe('needsPan / trackScale', () => {
  it('leaves the default measure-long fragment alone', () => {
    for (const count of [1, 2, VISIBLE_BEATS]) {
      expect(needsPan(beats(count))).toBe(false);
      expect(trackScale(beats(count))).toBe(1);
    }
  });

  it('measures the window in beats, not notes', () => {
    // Three whole notes are only three notes but twelve beats — it slides.
    expect(needsPan(beats(12))).toBe(true);
    expect(trackScale(beats(12))).toBe(3);
    // Eight sixteenths are eight notes but two beats — it does not.
    expect(needsPan(8)).toBe(false);
  });

  it('widens the track proportionally past the window', () => {
    expect(trackScale(beats(8))).toBe(2);
    expect(trackScale(beats(6))).toBe(1.5);
    expect(needsPan(beats(4) + 1)).toBe(true);
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
