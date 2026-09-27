import { describe, expect, it } from 'vitest';

import { ramp, stageProgress, thresholdPhases } from './threshold-phases';

describe('ramp', () => {
  it('clamps below and above its window', () => {
    expect(ramp(0.2, 0.6, 0)).toBe(0);
    expect(ramp(0.2, 0.6, 1)).toBe(1);
  });

  it('is symmetric about the middle of its window', () => {
    expect(ramp(0.2, 0.6, 0.4)).toBeCloseTo(0.5);
    expect(ramp(0.2, 0.6, 0.3) + ramp(0.2, 0.6, 0.5)).toBeCloseTo(1);
  });
});

describe('thresholdPhases', () => {
  it('starts with the facade at rest', () => {
    expect(thresholdPhases(0)).toEqual({ open: 0, zoom: 0, flood: 0, words: 0 });
  });

  it('ends through the doorway, in the light, with the words shown', () => {
    expect(thresholdPhases(1)).toEqual({ open: 1, zoom: 1, flood: 1, words: 1 });
  });

  it('opens the doors before the light floods', () => {
    const early = thresholdPhases(0.4);
    expect(early.open).toBe(1);
    expect(early.flood).toBe(0);
  });

  it('never shows the words before the light has mostly filled the view', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const phase = thresholdPhases(p);
      if (phase.words > 0) expect(phase.flood).toBeGreaterThan(0.8);
    }
  });
});

describe('stageProgress', () => {
  it('is 0 until the section reaches the pin line', () => {
    expect(stageProgress(300, 54, 1000)).toBe(0);
  });

  it('runs linearly while pinned and clamps at the end', () => {
    expect(stageProgress(54 - 500, 54, 1000)).toBeCloseTo(0.5);
    expect(stageProgress(-5000, 54, 1000)).toBe(1);
  });

  it('treats a stage with no travel as not started', () => {
    expect(stageProgress(-100, 54, 0)).toBe(0);
  });
});
