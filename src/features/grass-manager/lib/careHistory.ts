import type { CareEvent } from './types';
import { WHOLE_YARD } from './yard';

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function lastCare(events: CareEvent[], type: CareEvent['type'], scope: string, date: string): CareEvent | undefined {
  return events.filter((event) => event.type === type && event.at <= date &&
    (event.segmentId === WHOLE_YARD || event.segmentId === scope))
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function dateInYard(now: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function clockInYard(now: Date, timezone: string): string {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(now);
  return `${dateInYard(now, timezone)}T${time}`;
}
