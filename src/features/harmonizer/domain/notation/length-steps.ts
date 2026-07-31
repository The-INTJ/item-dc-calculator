/**
 * Stepping a note's length by single sixteenths — the note grid's x-axis.
 *
 * The grid moves one sixteenth at a time rather than jumping between written
 * values (…eighth, dotted eighth, quarter…). A sixteenth is the unit the whole
 * workbench measures in, and it is the only step that can reach EVERY length a
 * note is allowed to have. Lengths with no symbol of their own — five
 * sixteenths, seven — are ordinary destinations, not gaps: they are simply
 * drawn as a tied chain, which decomposeNoteSpan already knows how to do.
 *
 * (4/4 assumption — see the meter ledger in domain/timing.ts: the ceiling is
 * one measure because the editor's viewport is one measure.)
 */

import { UNITS_PER_MEASURE } from '../timing';
import { MIN_NOTE_UNITS } from '../voice-editing';

/**
 * The length `steps` sixteenths away, or null once it runs past a note's
 * shortest or longest allowed value. Null is what empties a cell at the edge of
 * the grid rather than repeating its neighbour.
 */
export function stepUnits(units: number, steps: number): number | null {
  const next = units + steps;
  if (next < MIN_NOTE_UNITS || next > UNITS_PER_MEASURE) return null;
  return next;
}
