import { describe, expect, it } from 'vitest';

import { countWords, paceFor, recentPaceFor, snapshotDate, windowStart } from './pace';

describe('countWords', () => {
  it('skips lone punctuation and the export BOM', () => {
    expect(countWords('﻿Wick tossed his sword – catching it.\n\t“Absolutly.”  ')).toBe(7);
    expect(countWords('')).toBe(0);
  });
});

describe('snapshotDate', () => {
  it('keeps yesterday until 6am Eastern', () => {
    // 5:59am and 6:00am EDT on 2026-10-29.
    expect(snapshotDate(new Date('2026-10-29T09:59:00Z'))).toBe('2026-10-28');
    expect(snapshotDate(new Date('2026-10-29T10:00:00Z'))).toBe('2026-10-29');
  });

  it('follows Eastern standard time after the clocks change', () => {
    // 5:59am and 6:00am EST on 2026-11-02.
    expect(snapshotDate(new Date('2026-11-02T10:59:00Z'))).toBe('2026-11-01');
    expect(snapshotDate(new Date('2026-11-02T11:00:00Z'))).toBe('2026-11-02');
  });
});

describe('paceFor', () => {
  it('divides by the whole days since the first edit', () => {
    expect(paceFor(13_196, '2026-10-29')).toEqual({
      words: 13_196,
      days: 18,
      perDay: 733,
      snapshot: '2026-10-29',
      recent: null,
    });
  });

  it('never divides by zero on the first day', () => {
    expect(paceFor(500, '2026-10-11').days).toBe(1);
  });
});

describe('windowStart', () => {
  it('reaches back a week, across month ends', () => {
    expect(windowStart('2026-11-03')).toBe('2026-10-27');
  });
});

describe('recentPaceFor', () => {
  it('averages the words since the count a week earlier', () => {
    expect(recentPaceFor(13_196, '2026-10-29', { date: '2026-10-22', words: 8_000 })).toEqual({
      words: 5_196,
      days: 7,
      perDay: 742,
    });
  });

  it('spans fewer days while the history is short', () => {
    expect(recentPaceFor(1_300, '2026-10-31', { date: '2026-10-29', words: 1_000 })).toEqual({
      words: 300,
      days: 2,
      perDay: 150,
    });
  });

  it('waits for a count from an earlier day', () => {
    expect(recentPaceFor(1_000, '2026-10-29', null)).toBeNull();
    expect(recentPaceFor(1_000, '2026-10-29', { date: '2026-10-29', words: 900 })).toBeNull();
  });

  it('reads a week of cuts as zero', () => {
    expect(recentPaceFor(900, '2026-10-29', { date: '2026-10-22', words: 1_000 })?.perDay).toBe(0);
  });
});

describe('paceFor with a baseline', () => {
  it('carries the rolling week alongside the overall pace', () => {
    expect(paceFor(13_196, '2026-10-29', { date: '2026-10-22', words: 8_000 }).recent?.perDay).toBe(742);
  });
});
