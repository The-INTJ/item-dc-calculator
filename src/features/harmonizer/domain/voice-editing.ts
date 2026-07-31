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
import {
  durationToUnits,
  timeToUnits,
  UNITS_PER_MEASURE,
  unitsToDuration,
  unitsToTime,
} from './timing';

export interface TimedEvent {
  id: string;
  start: MusicalTime;
  duration: RationalDuration;
  /** Present and silent — see VoiceEvent.isRest. */
  isRest?: boolean;
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

/** Where a part ends, in units from the fragment start (0 when it has nothing). */
export function partEndUnits(events: TimedEvent[]): number {
  return events.reduce((end, event) => Math.max(end, spanOf(event).right), 0);
}

/**
 * How much of the measure a part has left to fill. Zero is what greys out the
 * staff's add button — and legacy content that already runs past a measure has
 * none either, which is the same answer the editor's cap gives.
 * (4/4 assumption — see the meter ledger in domain/timing.ts.)
 */
export function roomInMeasure(events: TimedEvent[]): number {
  return Math.max(0, UNITS_PER_MEASURE - partEndUnits(events));
}

/**
 * Take a note out of its place: everything after it moves up to close the gap,
 * and the time it occupied reappears as a REST at the end of the part.
 *
 * The part therefore keeps its exact length, and no silence is ever left that
 * you cannot point at. That is the rule this obeys: a rest behaves like a note,
 * so every rest has to BE one. Simply dropping the event would leave a hole in
 * the middle drawn as a rest with no event behind it — a rest you can look at
 * but never click, and so never turn back into a note.
 *
 * Deleting the last note is the same thing as silencing it, which falls out
 * rather than being special-cased: nothing is after it to move up.
 *
 * Null when the event is missing, or when it is the part's only one — a part
 * keeps at least one note, and silencing is how you empty a part.
 */
export function deleteTimedEvent<T extends TimedEvent>(events: T[], eventId: string): T[] | null {
  if (events.length <= 1) return null;
  const index = events.findIndex((event) => event.id === eventId);
  if (index === -1) return null;

  const spans = events.map(spanOf);
  const removed = spans[index];
  const units = removed.right - removed.left;
  const partEnd = spans[spans.length - 1].right;

  const kept: T[] = [];
  for (let i = 0; i < events.length; i += 1) {
    if (i === index) continue;
    const span = spans[i];
    // Anything that started at or after the removed note closes up behind it;
    // anything before it, and any rest between them, stays put.
    kept.push(
      span.left >= removed.right ? placed(events[i], span.left - units, span.right - units) : events[i],
    );
  }

  // The note itself becomes the trailing rest, keeping its pitch and its id, so
  // clicking that rest offers back the very note that was taken out.
  kept.push(placed({ ...events[index], isRest: true }, partEnd - units, partEnd));
  return kept;
}

/**
 * Insert a new event adjacent to a neighbor, matching the neighbor's length.
 * 'before': the new event takes the neighbor's placement and the neighbor plus
 * everything later translates right by the new event's length. 'after': the new
 * event lands at the neighbor's end and strictly-later events translate right.
 * The part grows; null when the neighbor is missing or there is no room.
 *
 * `shrinkToFit` changes what "no room" means: instead of refusing an event that
 * would overrun the cap, the new event takes whatever room is left. That is
 * what the staff's add button wants — someone filling out the end of a measure
 * means to fill the space, not to be told the space is the wrong shape.
 */
export function insertAdjacentTimedEvent<T extends TimedEvent>(
  events: T[],
  neighborId: string,
  side: 'before' | 'after',
  build: (placement: { startUnits: number; units: number }) => T,
  options: { maxTotalUnits?: number; shrinkToFit?: boolean } = {},
): T[] | null {
  const maxTotal = options.maxTotalUnits ?? DEFAULT_MAX_TOTAL_UNITS;
  const index = events.findIndex((event) => event.id === neighborId);
  if (index === -1) return null;
  const spans = events.map(spanOf);
  const neighbor = spans[index];
  const insertAt = side === 'before' ? neighbor.left : neighbor.right;
  const lastRight = spans[spans.length - 1].right;
  const room = maxTotal - lastRight;
  const wanted = neighbor.right - neighbor.left;
  const units = wanted <= room || !options.shrinkToFit ? wanted : room;
  if (units > room || units < MIN_NOTE_UNITS) return null;

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
