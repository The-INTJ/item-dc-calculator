/** Turns resolved schedule data into the sentences the UI shows. */

import { formatOrdinal, formatShortDate } from './sundays';
import type { DonutLogEntry, ResolvedSunday } from './types';

/** The small line under a name explaining why that name is there. */
export function describeAssignment(sunday: ResolvedSunday): string {
  switch (sunday.source) {
    case 'override':
      return sunday.note ?? 'One-off assignment for this week.';
    case 'rotation':
      return `${formatOrdinal(sunday.ordinal)} — their usual spot in the rotation.`;
    case 'cover':
      return `Covering the ${formatOrdinal(sunday.ordinal).toLowerCase()} for ${sunday.coveringForName}.`;
    case 'fill':
      return 'Filling in — longest since their last turn.';
    default:
      return 'Nobody is assigned yet. Tap "I can do it" to claim it.';
  }
}

/** One-line summary of a log entry, e.g. "Aug 9 — Josh took over from Drew". */
export function describeLogEntry(entry: DonutLogEntry): string {
  const when = formatShortDate(entry.date);
  switch (entry.kind) {
    case 'declined':
      return `${when} — ${entry.personName} took over from ${entry.previousName ?? 'the rotation'}`;
    case 'volunteered':
      return `${when} — ${entry.personName} volunteered`;
    case 'cleared':
      return `${when} — back to the normal rotation`;
    default:
      return `${when} — ${entry.personName} assigned`;
  }
}
