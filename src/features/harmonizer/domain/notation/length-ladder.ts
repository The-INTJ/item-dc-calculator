/**
 * The ladder of written note lengths, for stepping a note longer or shorter.
 *
 * The grid moves along these rungs rather than along raw sixteenths so that
 * every step lands on a length notation can draw with one symbol. Stepping by
 * sixteenths would offer lengths like five, which can only be written as a
 * quarter tied to a sixteenth — a fine thing to arrive at by dragging, but a
 * confusing thing to be offered as a choice.
 *
 * (4/4 assumption — see the meter ledger in domain/timing.ts: the ladder stops
 * at the whole note because that is one measure.)
 */

import { UNITS_PER_MEASURE } from '../timing';

/** Written lengths in sixteenths, shortest to longest: s e e. q q. h h. w */
export const LENGTH_LADDER: number[] = [1, 2, 3, 4, 6, 8, 12, UNITS_PER_MEASURE];

/** The rung a length sits on, or the nearest one when it sits between rungs. */
export function ladderIndexFor(units: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < LENGTH_LADDER.length; index += 1) {
    const distance = Math.abs(LENGTH_LADDER[index] - units);
    // On a tie the longer rung wins, so an in-between length rounds up rather
    // than quietly shortening the note the moment it is touched.
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * The length `steps` rungs away, or null when the ladder runs out. Null is what
 * empties a cell at the edge of the grid rather than repeating its neighbour.
 */
export function stepLength(units: number, steps: number): number | null {
  const index = ladderIndexFor(units) + steps;
  if (index < 0 || index >= LENGTH_LADDER.length) return null;
  return LENGTH_LADDER[index];
}
