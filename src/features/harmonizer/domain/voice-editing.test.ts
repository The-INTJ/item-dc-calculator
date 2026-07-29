import { describe, expect, it } from 'vitest';
import type { MusicalTime, RationalDuration } from './music-types';
import { durationToUnits, timeToUnits } from './timing';
import {
  deleteTimedEvent,
  insertAdjacentTimedEvent,
  resizeTimedEvents,
  type TimedEvent,
} from './voice-editing';

function makeEvent(id: string, startUnits: number, units: number): TimedEvent {
  const measure = Math.floor(startUnits / 16) + 1;
  const remainder = startUnits % 16;
  const start: MusicalTime = {
    measure,
    beat: Math.floor(remainder / 4) + 1,
    subdivision: remainder % 4,
  };
  const duration: RationalDuration = { numerator: units, denominator: 16 };
  return { id, start, duration };
}

function spansOf(events: TimedEvent[]): Array<[number, number]> {
  return events.map((event) => {
    const left = timeToUnits(event.start);
    return [left, left + durationToUnits(event.duration)];
  });
}

// The fixture shape: q (0–4), q (4–8), h (8–16).
const base = [makeEvent('a', 0, 4), makeEvent('b', 4, 4), makeEvent('c', 8, 8)];

describe('resizeTimedEvents', () => {
  it('moves an inner right edge as a shared boundary, conserving total length', () => {
    const result = resizeTimedEvents(base, 'a', 'right', 6);
    expect(result).not.toBeNull();
    expect(spansOf(result ?? [])).toEqual([
      [0, 6],
      [6, 8],
      [8, 16],
    ]);
  });

  it('clamps a boundary move so the neighbor keeps at least one unit', () => {
    const result = resizeTimedEvents(base, 'a', 'right', 12);
    expect(spansOf(result ?? [])).toEqual([
      [0, 7],
      [7, 8],
      [8, 16],
    ]);
  });

  it('moves an inner left edge by shrinking the note to the left', () => {
    // Dragging b's left edge left grows b while a shrinks.
    const result = resizeTimedEvents(base, 'b', 'left', 2);
    expect(spansOf(result ?? [])).toEqual([
      [0, 2],
      [2, 8],
      [8, 16],
    ]);
  });

  it('extends the part from the last note’s right edge', () => {
    const result = resizeTimedEvents(base, 'c', 'right', 20);
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 20],
    ]);
  });

  it('caps the last note at the hard maximum', () => {
    const result = resizeTimedEvents(base, 'c', 'right', 999, { maxTotalUnits: 32 });
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 32],
    ]);
  });

  it('never lets the first note’s left edge move before the fragment start', () => {
    expect(resizeTimedEvents(base, 'a', 'left', -3)).toBeNull();
  });

  it('creates a leading rest when the first note’s left edge drags right', () => {
    const result = resizeTimedEvents(base, 'a', 'left', 2);
    expect(spansOf(result ?? [])).toEqual([
      [2, 4],
      [4, 8],
      [8, 16],
    ]);
  });

  it('ripples later notes when shift is held on a right edge', () => {
    const result = resizeTimedEvents(base, 'a', 'right', 8, { ripple: true });
    expect(spansOf(result ?? [])).toEqual([
      [0, 8],
      [8, 12],
      [12, 20],
    ]);
  });

  it('ripple shrinking pulls later notes earlier', () => {
    const result = resizeTimedEvents(base, 'b', 'right', 6, { ripple: true });
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 6],
      [6, 14],
    ]);
  });

  it('moves freely within a rest gap without touching the neighbor', () => {
    const gapped = [makeEvent('a', 0, 4), makeEvent('b', 8, 8)];
    const shrunk = resizeTimedEvents(gapped, 'a', 'right', 2);
    expect(spansOf(shrunk ?? [])).toEqual([
      [0, 2],
      [8, 16],
    ]);
    const grown = resizeTimedEvents(gapped, 'a', 'right', 12);
    expect(spansOf(grown ?? [])).toEqual([
      [0, 8],
      [8, 16],
    ]);
    const laterIn = resizeTimedEvents(gapped, 'b', 'left', 6);
    expect(spansOf(laterIn ?? [])).toEqual([
      [0, 4],
      [6, 16],
    ]);
  });

  it('returns null for no-ops and unknown events', () => {
    expect(resizeTimedEvents(base, 'a', 'right', 4)).toBeNull();
    expect(resizeTimedEvents(base, 'nope', 'right', 6)).toBeNull();
  });

  it('deletes an event leaving a rest gap, but never the last event', () => {
    const result = deleteTimedEvent(base, 'b');
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [8, 16],
    ]);
    expect(deleteTimedEvent(base, 'nope')).toBeNull();
    expect(deleteTimedEvent([base[0]], 'a')).toBeNull();
  });

  it('inserts before by taking the neighbor placement and rippling right', () => {
    const result = insertAdjacentTimedEvent(base, 'b', 'before', ({ startUnits, units }) =>
      makeEvent('new', startUnits, units),
    );
    expect(result?.map((event) => event.id)).toEqual(['a', 'new', 'b', 'c']);
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 12],
      [12, 20],
    ]);
  });

  it('inserts after, translating only strictly-later events', () => {
    const result = insertAdjacentTimedEvent(base, 'a', 'after', ({ startUnits, units }) =>
      makeEvent('new', startUnits, units),
    );
    expect(result?.map((event) => event.id)).toEqual(['a', 'new', 'b', 'c']);
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 12],
      [12, 20],
    ]);
    // Append at the very end: no translation needed.
    const appended = insertAdjacentTimedEvent(base, 'c', 'after', ({ startUnits, units }) =>
      makeEvent('tail', startUnits, units),
    );
    expect(spansOf(appended ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 16],
      [16, 24],
    ]);
  });

  it('rejects inserts that would exceed the total-units cap', () => {
    expect(
      insertAdjacentTimedEvent(
        base,
        'c',
        'after',
        ({ startUnits, units }) => makeEvent('tail', startUnits, units),
        { maxTotalUnits: 16 },
      ),
    ).toBeNull();
    expect(
      insertAdjacentTimedEvent(base, 'nope', 'after', ({ startUnits, units }) =>
        makeEvent('x', startUnits, units),
      ),
    ).toBeNull();
  });

  it('preserves extra fields on resized events', () => {
    const events = [{ ...makeEvent('a', 0, 4), tag: 'keep' }, { ...makeEvent('b', 4, 4), tag: 'also' }];
    const result = resizeTimedEvents(events, 'a', 'right', 6);
    expect(result?.[0].tag).toBe('keep');
    expect(result?.[1].tag).toBe('also');
  });
});
