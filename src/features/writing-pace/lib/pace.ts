/**
 * Words-per-day for one Google Doc.
 *
 * The count is taken once a day, at 6am Eastern: until 6am the previous
 * snapshot stands. Words are divided by the whole days from the doc's first
 * edit to the snapshot's date, so a 6am snapshot covers through yesterday.
 *
 * The rolling week compares the count to the one stored a week earlier, so it
 * covers the seven days before the snapshot. Counts are stored only on days
 * the widget loads; after a gap, or before a week of history exists, the
 * window starts at the oldest count inside it and says how many days it spans.
 */

import { addDays, daysBetween, isoDateIn } from '@/lib/dates/calendarDays';

export const WRITING = {
  /** The doc's first edit: created 2026-10-11 at 8:27pm Eastern. */
  startDate: '2026-10-11',
  timeZone: 'America/New_York',
  snapshotHour: 6,
  windowDays: 7,
} as const;

/** One day's stored count. */
export interface WordSnapshot {
  /** `YYYY-MM-DD` of the snapshot. */
  date: string;
  words: number;
}

export interface RecentPace {
  words: number;
  days: number;
  perDay: number;
}

export interface WritingPace {
  words: number;
  days: number;
  perDay: number;
  /** `YYYY-MM-DD` of the 6am snapshot these numbers come from. */
  snapshot: string;
  /** The rolling week, or null until a count from an earlier day is stored. */
  recent: RecentPace | null;
}

/**
 * Words as a word processor counts them: whitespace-separated runs holding at
 * least one letter or digit, so a lone dash is not a word.
 */
export function countWords(text: string) {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** The date of the most recent 6am snapshot at `now`. */
export function snapshotDate(now: Date) {
  const shifted = new Date(now.getTime() - WRITING.snapshotHour * 3_600_000);
  return isoDateIn(shifted, WRITING.timeZone);
}

/** The earliest date whose count can start the rolling week ending at `snapshot`. */
export function windowStart(snapshot: string) {
  return addDays(snapshot, -WRITING.windowDays);
}

/** `baseline` is the oldest count stored from `windowStart(snapshot)` to the day before `snapshot`. */
export function recentPaceFor(words: number, snapshot: string, baseline: WordSnapshot | null): RecentPace | null {
  const days = baseline ? daysBetween(baseline.date, snapshot) : 0;
  if (!baseline || days < 1) {
    return null;
  }
  // Cutting more than was written that week reads as a zero, not a negative.
  const written = Math.max(0, words - baseline.words);
  return { words: written, days, perDay: Math.round(written / days) };
}

export function paceFor(words: number, snapshot: string, baseline: WordSnapshot | null = null): WritingPace {
  const days = Math.max(1, daysBetween(WRITING.startDate, snapshot));
  return {
    words,
    days,
    perDay: Math.round(words / days),
    snapshot,
    recent: recentPaceFor(words, snapshot, baseline),
  };
}
