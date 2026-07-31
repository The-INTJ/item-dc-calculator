/**
 * Date and duration formatting for plant data. Pure functions only.
 */

import { daysBetween } from './stats';

/** Human phrase for "how long ago", e.g. "never", "today", "5 days ago". */
export function formatDaysAgo(at: number | null, now: number): string {
  if (at === null) {
    return 'never';
  }
  const days = daysBetween(at, now);
  if (days < 1 / 24) {
    return 'just now';
  }
  if (days < 1) {
    return 'today';
  }
  const whole = Math.floor(days);
  return whole === 1 ? 'yesterday' : `${whole} days ago`;
}

/** Compact day count for badges, e.g. "5d" or "—" when there is no history. */
export function formatDaysShort(at: number | null, now: number): string {
  if (at === null) {
    return '—';
  }
  return `${Math.floor(Math.max(0, daysBetween(at, now)))}d`;
}

/** One-decimal day interval, e.g. "4.2 days" or "—". */
export function formatInterval(days: number | null): string {
  return days === null ? '—' : `${days.toFixed(1)} days`;
}

export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoDateTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

export function describeSince(at: number | null, daysSince: number | null): string {
  if (at === null || daysSince === null) {
    return 'never';
  }
  return `${daysSince.toFixed(1)} days ago (${isoDate(at)})`;
}
