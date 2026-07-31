import { describe, expect, it } from 'vitest';
import type { MusicalTime, RationalDuration } from './music-types';
import { durationToUnits, timeToUnits } from './timing';
import {
  deleteTimedEvent,
  insertAdjacentTimedEvent,
  partEndUnits,
  resizeTimedEvents,
  roomInMeasure,
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

  it('closes the gap a deleted note leaves, and rests out the end instead', () => {
    // The fixture is q (0–4), q (4–8), h (8–16). Taking the middle quarter out
    // moves the half note up to meet the first quarter, and the four sixteenths
    // it freed become a rest at the end — so the part is still exactly as long.
    const result = deleteTimedEvent(base, 'b');
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 12],
      [12, 16],
    ]);
    expect(result?.map((event) => event.id)).toEqual(['a', 'c', 'b']);
    expect(result?.map((event) => event.isRest === true)).toEqual([false, false, true]);
  });

  it('keeps the deleted note whole, so the rest can offer it back', () => {
    // The rest IS the note that was taken out — same id, same length — which is
    // what lets clicking it turn it back into the note it was.
    const result = deleteTimedEvent(base, 'b');
    const rest = result?.find((event) => event.id === 'b');
    expect(rest?.isRest).toBe(true);
    expect(durationToUnits(rest!.duration)).toBe(4);
  });

  it('silences the last note where it stands, since nothing follows it', () => {
    const result = deleteTimedEvent(base, 'c');
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 16],
    ]);
    expect(result?.map((event) => event.isRest === true)).toEqual([false, false, true]);
  });

  it('never takes a part‘s only note', () => {
    expect(deleteTimedEvent(base, 'nope')).toBeNull();
    expect(deleteTimedEvent([base[0]], 'a')).toBeNull();
  });

  it('leaves a part exactly as long as it was', () => {
    // The measure cannot be violated in either direction: deleting frees no
    // room, so a part that filled its bar still fills it.
    expect(partEndUnits(base)).toBe(16);
    expect(partEndUnits(deleteTimedEvent(base, 'b') ?? [])).toBe(16);
    expect(roomInMeasure(deleteTimedEvent(base, 'b') ?? [])).toBe(0);
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

  it('takes the room that is left when asked to shrink to fit', () => {
    // The fixture ends at 16. A part ending at 12 has four units left, and the
    // note before it is a half note — too long to copy, so the new note takes
    // the four rather than being refused.
    const short = [makeEvent('a', 0, 4), makeEvent('b', 4, 8)];
    const result = insertAdjacentTimedEvent(
      short,
      'b',
      'after',
      ({ startUnits, units }) => makeEvent('tail', startUnits, units),
      { maxTotalUnits: 16, shrinkToFit: true },
    );
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 12],
      [12, 16],
    ]);
  });

  it('still refuses when there is no room at all to shrink into', () => {
    expect(
      insertAdjacentTimedEvent(
        base,
        'c',
        'after',
        ({ startUnits, units }) => makeEvent('tail', startUnits, units),
        { maxTotalUnits: 16, shrinkToFit: true },
      ),
    ).toBeNull();
  });

  it('leaves a note that already fits at its neighbour‘s length', () => {
    // Shrinking to fit only bites when the copy would overrun; otherwise the
    // new note matches the one before it exactly, as it always did.
    const short = [makeEvent('a', 0, 4), makeEvent('b', 4, 4)];
    const result = insertAdjacentTimedEvent(
      short,
      'b',
      'after',
      ({ startUnits, units }) => makeEvent('tail', startUnits, units),
      { maxTotalUnits: 16, shrinkToFit: true },
    );
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 8],
      [8, 12],
    ]);
  });

  it('preserves extra fields on resized events', () => {
    const events = [{ ...makeEvent('a', 0, 4), tag: 'keep' }, { ...makeEvent('b', 4, 4), tag: 'also' }];
    const result = resizeTimedEvents(events, 'a', 'right', 6);
    expect(result?.[0].tag).toBe('keep');
    expect(result?.[1].tag).toBe('also');
  });
});

describe('the measure cannot be violated', () => {
  const tail = ({ startUnits, units }: { startUnits: number; units: number }) =>
    makeEvent('tail', startUnits, units);
  const cap = { maxTotalUnits: 16 };

  it('refuses every path that would push a part past its bar', () => {
    // There is no over-measure state to render, because there is no way to
    // reach one. Each of these is a way a part could have grown.
    expect(insertAdjacentTimedEvent(base, 'c', 'after', tail, cap)).toBeNull();
    expect(
      insertAdjacentTimedEvent(base, 'c', 'after', tail, { ...cap, shrinkToFit: true }),
    ).toBeNull();
    expect(partEndUnits(resizeTimedEvents(base, 'c', 'right', 40, cap) ?? base)).toBe(16);
    expect(partEndUnits(deleteTimedEvent(base, 'b') ?? [])).toBe(16);
  });

  it('adds exactly the room that is left when the note it copies will not fit', () => {
    // Ends at 12 with four sixteenths to spare, and the note before is a half.
    const short = [makeEvent('a', 0, 4), makeEvent('b', 4, 8)];
    const result = insertAdjacentTimedEvent(short, 'b', 'after', tail, {
      ...cap,
      shrinkToFit: true,
    });
    expect(spansOf(result ?? [])).toEqual([
      [0, 4],
      [4, 12],
      [12, 16],
    ]);
    expect(partEndUnits(result ?? [])).toBe(16);
  });
});

describe('how much of a measure a part has left', () => {
  it('measures from where the part ends, not from how many notes it has', () => {
    expect(partEndUnits(base)).toBe(16);
    expect(partEndUnits([makeEvent('a', 0, 4)])).toBe(4);
    expect(partEndUnits([])).toBe(0);
  });

  it('reports the room the add button offers', () => {
    expect(roomInMeasure([makeEvent('a', 0, 4)])).toBe(12);
    expect(roomInMeasure(base)).toBe(0);
  });

  it('gives legacy content that already overran a measure no room either', () => {
    // Two measures of content predate the cap. It stays editable in place, but
    // nothing may be added to it — the same answer the editor's cap gives.
    expect(roomInMeasure([makeEvent('a', 0, 32)])).toBe(0);
  });
});
