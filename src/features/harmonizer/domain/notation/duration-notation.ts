/**
 * Turning grid spans into written note values.
 *
 * The workbench measures every note in sixteenths, and a drag can land on any
 * whole number of them. Notation has no symbol for five sixteenths, so a span
 * becomes a chain of written values joined by ties. Where the chain breaks is a
 * musical decision, not an arithmetic one: a reader finds the beat by seeing it,
 * so a value that hides a strong beat gets split even when a single symbol could
 * have covered the span.
 *
 * (4/4 assumption — see the meter ledger in domain/timing.ts. The boundary
 * strengths below ARE the 4/4 accent pattern, and the whole-bar rest and barline
 * cadence assume a sixteen-unit measure.)
 */

import { UNITS_PER_BEAT, UNITS_PER_MEASURE } from '../timing';
import type { NotatedBase, NotatedValue, RestValue } from './staff-types';

/** Every length that has a symbol of its own, longest first. No double dots. */
const WRITTEN_VALUES: { units: number; base: NotatedBase; dots: 0 | 1 }[] = [
  { units: 16, base: 'w', dots: 0 },
  { units: 12, base: 'h', dots: 1 },
  { units: 8, base: 'h', dots: 0 },
  { units: 6, base: 'q', dots: 1 },
  { units: 4, base: 'q', dots: 0 },
  { units: 3, base: 'e', dots: 1 },
  { units: 2, base: 'e', dots: 0 },
  { units: 1, base: 's', dots: 0 },
];

const HALF_MEASURE = UNITS_PER_MEASURE / 2;

/**
 * How strongly a position divides the music. A note may not hide a boundary
 * stronger than its own weight allows, and a split always lands on the strongest
 * boundary available.
 */
function boundaryStrength(unit: number): number {
  if (unit % UNITS_PER_MEASURE === 0) return 4; // barline
  if (unit % HALF_MEASURE === 0) return 3; // the middle of the bar
  if (unit % UNITS_PER_BEAT === 0) return 2; // a beat
  if (unit % (UNITS_PER_BEAT / 2) === 0) return 1; // half a beat
  return 0;
}

function written(units: number) {
  return WRITTEN_VALUES.find((value) => value.units === units) ?? null;
}

/**
 * The single symbol for a length, or null when the length has none. Lets a
 * chooser show the note it would actually draw rather than a number.
 */
export function writtenValue(units: number): { base: NotatedBase; dots: 0 | 1 } | null {
  const value = written(units);
  return value ? { base: value.base, dots: value.dots } : null;
}

/**
 * Whether a span may be written as one symbol. A barline always breaks a note.
 * Past that, the longer the note the more it is allowed to cover: a half note
 * from a beat may span the middle of the bar (the familiar syncopation written
 * as one note), but a dotted eighth may not even cross a beat.
 */
function writableAsOne(startUnit: number, units: number): boolean {
  let strongest = 0;
  for (let unit = startUnit + 1; unit < startUnit + units; unit += 1) {
    strongest = Math.max(strongest, boundaryStrength(unit));
  }
  if (strongest >= 4) return false;
  if (strongest === 3) return units >= HALF_MEASURE && startUnit % UNITS_PER_BEAT === 0;
  if (strongest === 2) return units >= UNITS_PER_BEAT && startUnit % (UNITS_PER_BEAT / 2) === 0;
  return true;
}

/** The strongest interior boundary; ties go to the one nearest the middle, later wins. */
function splitPoint(startUnit: number, units: number): number {
  const middle = startUnit + units / 2;
  let best = startUnit + 1;
  let bestStrength = -1;
  let bestDistance = Infinity;
  for (let unit = startUnit + 1; unit < startUnit + units; unit += 1) {
    const strength = boundaryStrength(unit);
    const distance = Math.abs(unit - middle);
    const better =
      strength > bestStrength ||
      (strength === bestStrength && distance <= bestDistance);
    if (better) {
      best = unit;
      bestStrength = strength;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * A span of held sound as written values, tied together. `startUnit` is absolute
 * on the grid, so the same length notates differently depending on where it
 * falls in the bar.
 */
export function decomposeNoteSpan(startUnit: number, units: number): NotatedValue[] {
  if (units <= 0) return [];
  const value = written(units);
  if (value && writableAsOne(startUnit, units)) {
    return [{ startUnit, units, base: value.base, dots: value.dots, tieToNext: false }];
  }
  const split = splitPoint(startUnit, units);
  const head = decomposeNoteSpan(startUnit, split - startUnit);
  const tail = decomposeNoteSpan(split, startUnit + units - split);
  const last = head[head.length - 1];
  if (last) last.tieToNext = true;
  return [...head, ...tail];
}

/** Rests only ever use these — no dots, so a silence is counted rather than parsed. */
const REST_UNITS: number[] = [UNITS_PER_BEAT, UNITS_PER_BEAT / 2, 1];

function restValue(startUnit: number, units: number): RestValue {
  const value = written(units);
  if (!value) throw new Error(`no rest symbol for ${units} units`);
  return { startUnit, units, base: value.base };
}

/**
 * A gap as written rests. An empty bar gets the single whole rest that stands
 * for it; otherwise the silence is spelled beat by beat, merging only into
 * half-bar units, so the eye can count it against the beat.
 */
export function decomposeRestSpan(startUnit: number, units: number): RestValue[] {
  const rests: RestValue[] = [];
  const end = startUnit + units;
  let cursor = startUnit;
  while (cursor < end) {
    const left = end - cursor;
    if (cursor % UNITS_PER_MEASURE === 0 && left >= UNITS_PER_MEASURE) {
      rests.push(restValue(cursor, UNITS_PER_MEASURE));
      cursor += UNITS_PER_MEASURE;
    } else if (cursor % HALF_MEASURE === 0 && left >= HALF_MEASURE) {
      rests.push(restValue(cursor, HALF_MEASURE));
      cursor += HALF_MEASURE;
    } else {
      const nextBeat = (Math.floor(cursor / UNITS_PER_BEAT) + 1) * UNITS_PER_BEAT;
      const chunk = Math.min(nextBeat, end) - cursor;
      const fits = REST_UNITS.find((size) => size <= chunk && cursor % size === 0) ?? 1;
      rests.push(restValue(cursor, fits));
      cursor += fits;
    }
  }
  return rests;
}
