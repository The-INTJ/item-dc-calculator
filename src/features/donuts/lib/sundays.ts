/**
 * Calendar helpers for the donut rotation.
 *
 * Dates are handled as `YYYY-MM-DD` wall dates and converted to `Date` only at
 * UTC midnight, so arithmetic never drifts across a daylight-saving boundary.
 */

import type { IsoDate, SundayOrdinal } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Parse a wall date into a `Date` pinned to UTC midnight. */
export function fromIsoDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Format a UTC-midnight `Date` back to a wall date. */
export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Today's wall date in the caller's local timezone. */
export function todayIso(now: Date = new Date()): IsoDate {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return toIsoDate(local);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return toIsoDate(new Date(fromIsoDate(iso).getTime() + days * MS_PER_DAY));
}

export function addWeeks(iso: IsoDate, weeks: number): IsoDate {
  return addDays(iso, weeks * 7);
}

export function isSunday(iso: IsoDate): boolean {
  return fromIsoDate(iso).getUTCDay() === 0;
}

/**
 * The Sunday a given day belongs to: the same day when it *is* Sunday (the
 * breakfast is that morning), otherwise the next one.
 */
export function upcomingSunday(iso: IsoDate): IsoDate {
  const day = fromIsoDate(iso).getUTCDay();
  return day === 0 ? iso : addDays(iso, 7 - day);
}

/**
 * Which ordinal Sunday of its month a date is. Sundays falling on days 1-7 are
 * the 1st Sunday, 8-14 the 2nd, and so on — which makes days 29-31 the 5th
 * Sunday in the months that have one.
 */
export function ordinalSundayOfMonth(iso: IsoDate): SundayOrdinal {
  const day = fromIsoDate(iso).getUTCDate();
  return Math.ceil(day / 7) as SundayOrdinal;
}

/** Every Sunday from `start` through `end`, inclusive. */
export function sundaysThrough(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  let cursor = isSunday(start) ? start : upcomingSunday(start);
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addWeeks(cursor, 1);
  }
  return dates;
}

const LONG_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

/** e.g. "Sunday, August 9". */
export function formatLongDate(iso: IsoDate): string {
  return LONG_DATE.format(fromIsoDate(iso));
}

/** e.g. "Aug 9". */
export function formatShortDate(iso: IsoDate): string {
  return SHORT_DATE.format(fromIsoDate(iso));
}

const ORDINAL_LABELS = ['1st', '2nd', '3rd', '4th', '5th'];

/** e.g. "2nd Sunday". */
export function formatOrdinal(ordinal: SundayOrdinal): string {
  return `${ORDINAL_LABELS[ordinal - 1]} Sunday`;
}
