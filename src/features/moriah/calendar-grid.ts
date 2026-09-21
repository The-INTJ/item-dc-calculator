import type { CalendarEvent } from './content';

/**
 * Month-grid math for the church calendar, kept pure and timezone-safe.
 *
 * Dates are handled as `YYYY-MM-DD` strings throughout. Parsing them with
 * `new Date('2026-10-04')` would land on UTC midnight and render as the 3rd
 * west of Greenwich, so every conversion here goes through local-noon.
 */

export interface DayCell {
  /** ISO date, or null for the leading/trailing blanks of the grid. */
  iso: string | null;
  dayOfMonth: number | null;
  inMonth: boolean;
  events: CalendarEvent[];
}

export interface MonthCursor {
  year: number;
  /** 0-indexed, matching Date. */
  month: number;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function toLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function toIso(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const shifted = new Date(cursor.year, cursor.month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function monthLabel(cursor: MonthCursor): string {
  return new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function eventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const bucket = byDate.get(event.date);
    if (bucket) bucket.push(event);
    else byDate.set(event.date, [event]);
  }
  for (const bucket of byDate.values()) {
    bucket.sort((a, b) => a.time.localeCompare(b.time));
  }
  return byDate;
}

/** Six weeks of cells, so the grid never changes height between months. */
export function buildMonthGrid(cursor: MonthCursor, events: CalendarEvent[]): DayCell[] {
  const byDate = eventsByDate(events);
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const cells: DayCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const dayOfMonth = index - firstWeekday + 1;
    const inMonth = dayOfMonth >= 1 && dayOfMonth <= daysInMonth;
    const iso = inMonth ? toIso(cursor.year, cursor.month, dayOfMonth) : null;
    cells.push({
      iso,
      dayOfMonth: inMonth ? dayOfMonth : null,
      inMonth,
      events: iso ? (byDate.get(iso) ?? []) : [],
    });
  }
  return cells;
}

/** Events on or after `fromIso`, soonest first. */
export function upcomingEvents(
  events: CalendarEvent[],
  fromIso: string,
  limit: number,
): CalendarEvent[] {
  return events
    .filter((event) => event.date >= fromIso)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, limit);
}

export function formatDayHeading(iso: string): string {
  return toLocalDate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  return toLocalDate(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Month, day and year — for the announcement cards, whose source dates span
 * several years. Omitting the year there would misdate them.
 */
export function formatLongDate(iso: string): string {
  return toLocalDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
