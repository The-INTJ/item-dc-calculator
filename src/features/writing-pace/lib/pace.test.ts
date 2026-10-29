import { describe, expect, it } from 'vitest';

import { countWords, paceFor, snapshotDate } from './pace';

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
    });
  });

  it('never divides by zero on the first day', () => {
    expect(paceFor(500, '2026-10-11').days).toBe(1);
  });
});
