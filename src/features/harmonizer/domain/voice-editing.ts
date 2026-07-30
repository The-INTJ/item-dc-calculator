/**
 * Pure edge-resize for time-ordered events on the sixteenth grid.
 *
 * Boundaries are 0-based sixteenth positions from the fragment start
 * (boundary b sits after b units; an event occupying units left..right has
 * left/right boundaries at those positions).
 *
 * Editing model (Drew's first editing review, 2026-07-29):
 * - Dragging an inner edge moves the boundary BETWEEN two contiguous notes:
 *   one grows while the other shrinks; the part's total length is conserved.
 * - The first note's left edge can never move before the fragment start, but
 *   may move right, creating a leading rest.
 * - The last note's right edge extends or shrinks the part freely.
 * - ripple (shift-drag; right edges only): the note resizes and every later
 *   note translates with it, changing the overall part length.
 * - Where a rest separates two notes, an edge moves freely within the gap.
 */

import type { MusicalTime, RationalDuration } from './music-types';
import { durationToUnits, timeToUnits, unitsToDuration, unitsToTime } from './timing';

export interface TimedEvent {
  id: string;
  start: MusicalTime;
  duration: RationalDuration;
}

export interface ResizeOptions {
  /** Shift-drag: translate everything after the resized note. Right edges only. */
  ripple?: boolean;
  /** Hard cap for the part's end boundary (default 4 measures = 64 units). */
  maxTotalUnits?: number;
}

export const MIN_NOTE_UNITS = 1;
// "4 measures" is four measures OF 4/4; the reducer passes a tighter
// one-measure cap (measureCap) in practice — see the meter ledger in
// domain/timing.ts.
const DEFAULT_MAX_TOTAL_UNITS = 64;

interface Span {
  left: number;
  right: number;
}

function spanOf(event: TimedEvent): Span {
  const left = timeToUnits(event.start);
  return { left, right: left + durationToUnits(event.duration) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function placed<T extends TimedEvent>(event: T, left: number, right: number): T {
  return { ...event, start: unitsToTime(left), duration: unitsToDuration(right - left) };
}

/** Delete an event; the gap becomes a rest. Null when missing or it is the part's only event. */
export function deleteTimedEvent<T extends TimedEvent>(events: T[], eventId: string): T[] | null {
  if (events.length <= 1) return null;
  const index = events.findIndex((event) => event.id === eventId);
  if (index === -1) return null;
  return events.filter((event) => event.id !== eventId);
}

/**
 * Insert a new event adjacent to a neighbor. 'before': the new event takes the
 * neighbor's placement and the neighbor plus everything later translates right
 * by the new event's length. 'after': the new event lands at the neighbor's
 * end and strictly-later events translate right. The part grows; null when the
 * neighbor is missing or the translated end exceeds maxTotalUnits.
 */
export function insertAdjacentTimedEvent<T extends TimedEvent>(
  events: T[],
  neighborId: string,
  side: 'before' | 'after',
  build: (placement: { startUnits: number; units: number }) => T,
  options: { maxTotalUnits?: number } = {},
): T[] | null {
  const maxTotal = options.maxTotalUnits ?? DEFAULT_MAX_TOTAL_UNITS;
  const index = events.findIndex((event) => event.id === neighborId);
  if (index === -1) return null;
  const spans = events.map(spanOf);
  const neighbor = spans[index];
  const units = neighbor.right - neighbor.left;
  const insertAt = side === 'before' ? neighbor.left : neighbor.right;
  const lastRight = spans[spans.length - 1].right;
  if (lastRight + units > maxTotal) return null;

  const created = build({ startUnits: insertAt, units });
  const result: T[] = [];
  for (let i = 0; i < events.length; i += 1) {
    const shift =
      (side === 'before' && i >= index) || (side === 'after' && i > index) ? units : 0;
    if (side === 'before' && i === index) result.push(created);
    result.push(
      shift > 0 ? placed(events[i], spans[i].left + shift, spans[i].right + shift) : events[i],
    );
    if (side === 'after' && i === index) result.push(created);
  }
  return result;
}

/**
 * Returns the new event array, or null when the drag resolves to no change
 * (so callers can keep the existing state reference). `events` must be
 * time-ordered; the result stays time-ordered.
 */
export function resizeTimedEvents<T extends TimedEvent>(
  events: T[],
  eventId: string,
  edge: 'left' | 'right',
  targetBoundary: number,
  options: ResizeOptions = {},
): T[] | null {
  const maxTotal = options.maxTotalUnits ?? DEFAULT_MAX_TOTAL_UNITS;
  const index = events.findIndex((event) => event.id === eventId);
  if (index === -1) return null;
  const spans = events.map(spanOf);
  const me = spans[index];

  if (edge === 'right') {
    const next = index + 1 < events.length ? spans[index + 1] : null;

    if (!next) {
      // Last note: the part end moves freely (within the hard cap).
      const target = clamp(targetBoundary, me.left + MIN_NOTE_UNITS, maxTotal);
      if (target === me.right) return null;
      return events.map((event, i) => (i === index ? placed(event, me.left, target) : event));
    }

    if (options.ripple) {
      const tailUnits = spans[spans.length - 1].right - me.right;
      const target = clamp(targetBoundary, me.left + MIN_NOTE_UNITS, maxTotal - tailUnits);
      const delta = target - me.right;
      if (delta === 0) return null;
      return events.map((event, i) => {
        if (i === index) return placed(event, me.left, target);
        if (i > index) return placed(event, spans[i].left + delta, spans[i].right + delta);
        return event;
      });
    }

    if (next.left === me.right) {
      // Contiguous neighbor: move the shared boundary; total length conserved.
      const target = clamp(targetBoundary, me.left + MIN_NOTE_UNITS, next.right - MIN_NOTE_UNITS);
      if (target === me.right) return null;
      return events.map((event, i) => {
        if (i === index) return placed(event, me.left, target);
        if (i === index + 1) return placed(event, target, next.right);
        return event;
      });
    }

    // A rest separates us from the next note: move freely within the gap.
    const target = clamp(targetBoundary, me.left + MIN_NOTE_UNITS, next.left);
    if (target === me.right) return null;
    return events.map((event, i) => (i === index ? placed(event, me.left, target) : event));
  }

  // edge === 'left' — ripple does not apply to left edges.
  const previous = index > 0 ? spans[index - 1] : null;

  if (!previous) {
    // First note: never before the fragment start; rightward creates a leading rest.
    const target = clamp(targetBoundary, 0, me.right - MIN_NOTE_UNITS);
    if (target === me.left) return null;
    return events.map((event, i) => (i === index ? placed(event, target, me.right) : event));
  }

  if (previous.right === me.left) {
    const target = clamp(
      targetBoundary,
      previous.left + MIN_NOTE_UNITS,
      me.right - MIN_NOTE_UNITS,
    );
    if (target === me.left) return null;
    return events.map((event, i) => {
      if (i === index - 1) return placed(event, previous.left, target);
      if (i === index) return placed(event, target, me.right);
      return event;
    });
  }

  const target = clamp(targetBoundary, previous.right, me.right - MIN_NOTE_UNITS);
  if (target === me.left) return null;
  return events.map((event, i) => (i === index ? placed(event, target, me.right) : event));
}
