/**
 * Words-per-day for one Google Doc.
 *
 * The count is taken once a day, at 6am Eastern: until 6am the previous
 * snapshot stands. Words are divided by the whole days from the doc's first
 * edit to the snapshot's date, so a 6am snapshot covers through yesterday.
 */

import { daysBetween, isoDateIn } from '@/lib/dates/calendarDays';

export const WRITING = {
  /** The doc's first edit: created 2026-10-11 at 8:27pm Eastern. */
  startDate: '2026-10-11',
  timeZone: 'America/New_York',
  snapshotHour: 6,
} as const;

export interface WritingPace {
  words: number;
  days: number;
  perDay: number;
  /** `YYYY-MM-DD` of the 6am snapshot these numbers come from. */
  snapshot: string;
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

export function paceFor(words: number, snapshot: string): WritingPace {
  const days = Math.max(1, daysBetween(WRITING.startDate, snapshot));
  return { words, days, perDay: Math.round(words / days), snapshot };
}
