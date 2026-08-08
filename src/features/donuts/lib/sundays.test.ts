import { describe, expect, it } from 'vitest';

import {
  addWeeks,
  formatLongDate,
  isSunday,
  ordinalSundayOfMonth,
  sundaysThrough,
  todayIso,
  upcomingSunday,
} from './sundays';

describe('ordinalSundayOfMonth', () => {
  it('buckets by day of month, so 1-7 is the 1st Sunday', () => {
    expect(ordinalSundayOfMonth('2026-08-02')).toBe(1);
    expect(ordinalSundayOfMonth('2026-08-09')).toBe(2);
    expect(ordinalSundayOfMonth('2026-08-16')).toBe(3);
    expect(ordinalSundayOfMonth('2026-08-23')).toBe(4);
    expect(ordinalSundayOfMonth('2026-08-30')).toBe(5);
  });

  it('handles a month whose 1st Sunday falls late', () => {
    // November 2026 starts on a Sunday, so the 5th Sunday is the 29th.
    expect(ordinalSundayOfMonth('2026-11-01')).toBe(1);
    expect(ordinalSundayOfMonth('2026-11-29')).toBe(5);
  });

  it('gives a month with only four Sundays no 5th', () => {
    const february = sundaysThrough('2027-02-01', '2027-02-28');
    expect(february.map(ordinalSundayOfMonth)).toEqual([1, 2, 3, 4]);
  });
});

describe('upcomingSunday', () => {
  it('returns the next Sunday from a weekday', () => {
    expect(upcomingSunday('2026-08-08')).toBe('2026-08-09'); // Saturday
    expect(upcomingSunday('2026-08-10')).toBe('2026-08-16'); // Monday
  });

  it('returns today when today is Sunday — the donuts are that morning', () => {
    expect(upcomingSunday('2026-08-09')).toBe('2026-08-09');
  });
});

describe('date arithmetic', () => {
  it('crosses a daylight-saving boundary without drifting', () => {
    // US DST ends 2026-11-01.
    expect(addWeeks('2026-10-25', 1)).toBe('2026-11-01');
    expect(isSunday('2026-11-01')).toBe(true);
  });

  it('crosses a year boundary', () => {
    expect(addWeeks('2026-12-27', 1)).toBe('2027-01-03');
    expect(ordinalSundayOfMonth('2027-01-03')).toBe(1);
  });

  it('lists every Sunday in a range inclusively', () => {
    expect(sundaysThrough('2026-08-08', '2026-08-30')).toEqual([
      '2026-08-09',
      '2026-08-16',
      '2026-08-23',
      '2026-08-30',
    ]);
  });

  it('reads the local wall date rather than the UTC one', () => {
    // 23:30 local on the 8th is the 9th in UTC for negative offsets.
    const lateEvening = new Date(2026, 7, 8, 23, 30);
    expect(todayIso(lateEvening)).toBe('2026-08-08');
  });
});

describe('formatting', () => {
  it('names the weekday from the wall date', () => {
    expect(formatLongDate('2026-08-09')).toBe('Sunday, August 9');
  });
});
