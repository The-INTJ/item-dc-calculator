import { describe, expect, it } from 'vitest';

import { BOOKS } from './books';
import { daysBetween, formatRange, readingForDate, readingForDay } from './readingPlan';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** Published KJV verse totals per book, to catch a mistyped chapter. */
const BOOK_TOTALS = [
  1533, 1213, 859, 1288, 959, 658, 618, 85, 810, 695, 816, 719, 942, 822, 280, 406, 167, 1070,
  2461, 915, 222, 117, 1292, 1364, 154, 1273, 357, 197, 73, 146, 21, 48, 105, 47, 56, 53, 38, 211,
  55, 1071, 678, 1151, 879, 1007, 433, 437, 257, 149, 155, 104, 95, 89, 47, 113, 83, 46, 25, 303,
  108, 105, 61, 105, 13, 14, 25, 404,
];

describe('verse data', () => {
  it('matches the KJV totals', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS.map((book) => sum(book.chapters))).toEqual(BOOK_TOTALS);
    expect(sum(BOOKS.map((book) => book.chapters.length))).toBe(1189);
    expect(sum(BOOKS.map((book) => sum(book.chapters)))).toBe(31102);
  });
});

describe('readingForDay', () => {
  it('finishes the chapter that day 1 lands in (verse 86 is Genesis 4:6)', () => {
    const day = readingForDay(1);
    expect(day.from).toEqual({ book: 'Genesis', chapter: 1 });
    expect(day.through).toEqual({ book: 'Genesis', chapter: 4 });
    expect(day.upTo).toEqual({ book: 'Genesis', chapter: 5 });
  });

  it('counts the next day from the chapter boundary', () => {
    // End of Genesis 4 is verse 106; 106 + 86 = 192 lands in Genesis 8.
    const day = readingForDay(2);
    expect(formatRange(day.from, day.through)).toBe('Genesis 5–8');
    expect(day.upTo).toEqual({ book: 'Genesis', chapter: 9 });
  });

  it('crosses into the next book', () => {
    const crossing = Array.from({ length: 30 }, (_, i) => readingForDay(i + 1)).find(
      (day) => day.from.book !== day.through.book,
    );
    expect(crossing && formatRange(crossing.from, crossing.through)).toMatch(/^Genesis \d+ – Exodus \d+$/);
  });

  it('ends at Revelation 22 and stays there', () => {
    const done = readingForDay(400);
    expect(done.through).toEqual({ book: 'Revelation', chapter: 22 });
    expect(done.upTo).toBeNull();
  });

  it('treats days before the start as day 1', () => {
    expect(readingForDay(0)).toEqual(readingForDay(1));
  });
});

describe('dates', () => {
  it('counts calendar days across month and DST boundaries', () => {
    expect(daysBetween('2026-10-27', '2026-10-28')).toBe(1);
    expect(daysBetween('2026-10-27', '2026-11-02')).toBe(6);
    expect(daysBetween('2026-10-27', '2027-10-27')).toBe(365);
  });

  it('puts the start date on day 1', () => {
    expect(readingForDate('2026-10-27').upTo).toEqual({ book: 'Genesis', chapter: 5 });
    expect(readingForDate('2026-10-28').upTo).toEqual({ book: 'Genesis', chapter: 9 });
  });
});
