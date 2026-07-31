/**
 * What the tap-to-edit grid offers around a note.
 *
 * The grid is a small map of the notes NEAR the one you tapped: length along x,
 * pitch along y, with the note you tapped in the middle. Both axes move by the
 * smallest step there is — one sixteenth, one half step — so everything the
 * editor can hold is reachable, including lengths that take a tie to write and
 * pitches from outside the key. Reach is deliberately short, because a grid
 * wide enough for a dramatic leap would be unusable for the ordinary nudge. Big
 * moves are made by taking a second step: the grid stays open and re-centres,
 * so a leap is a few taps in the same direction rather than a different
 * gesture.
 */

import type { SpelledPitch, ScaleDegreePitch, TonalContext } from '../../../domain/music-types';
import { stepChromatic } from '../../../domain/scale';
import { decomposeNoteSpan, shapeForDegree, stepUnits } from '../../../domain/notation';
import type { NotatedBase, ShapeId } from '../../../domain/notation';

export interface GridNote {
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  units: number;
  /** Where the note starts, 0-based on the grid — the same length is written
   *  differently depending on where in the bar it falls. */
  startUnit: number;
}

export interface GridCell {
  /** Steps from the centre: x in sixteenths, y in half steps. */
  x: number;
  y: number;
  /** Null when the length or the singable range runs out in that direction. */
  value: GridNote | null;
  shape: ShapeId | null;
  base: NotatedBase | null;
  dots: 0 | 1;
  /** The length takes more than one symbol to write; the cell draws the first. */
  tied: boolean;
  centre: boolean;
}

/** Walks `steps` half steps from a note; null once it leaves what a voice can sing. */
function stepPitch(
  context: TonalContext,
  note: GridNote,
  steps: number,
): { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } | null {
  let current: { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } = {
    pitch: note.pitch,
    scaleDegree: note.scaleDegree,
  };
  const direction = steps > 0 ? 1 : -1;
  for (let taken = 0; taken < Math.abs(steps); taken += 1) {
    const next = stepChromatic(context, current, direction);
    if (!next) return null;
    current = next;
  }
  return current;
}

/**
 * How a length is written where this note sits: the symbol the cell draws, and
 * whether more symbols would follow it. Five sixteenths on the beat is a
 * quarter tied to a sixteenth, so the cell shows the quarter and says it ties —
 * the alternative, hiding such lengths, would put holes in the middle of the
 * grid for no reason a singer would recognise.
 */
function drawnAs(
  startUnit: number,
  units: number,
): { base: NotatedBase; dots: 0 | 1; tied: boolean } | null {
  const values = decomposeNoteSpan(startUnit, units);
  const first = values[0];
  if (!first) return null;
  return { base: first.base, dots: first.dots, tied: values.length > 1 };
}

/**
 * The grid, row by row from the highest pitch down — the order it is drawn in,
 * so a higher note really does sit higher.
 */
export function buildGridCells(context: TonalContext, note: GridNote, reach: number): GridCell[][] {
  const rows: GridCell[][] = [];
  for (let y = reach; y >= -reach; y -= 1) {
    const row: GridCell[] = [];
    for (let x = -reach; x <= reach; x += 1) {
      const stepped = stepPitch(context, note, y);
      const units = stepUnits(note.units, x);
      const written = units === null ? null : drawnAs(note.startUnit, units);
      const reachable = stepped !== null && units !== null && written !== null;
      row.push({
        x,
        y,
        value: reachable ? { ...stepped, units, startUnit: note.startUnit } : null,
        shape: reachable ? shapeForDegree(context, stepped.scaleDegree.degree) : null,
        base: written?.base ?? null,
        dots: written?.dots ?? 0,
        tied: written?.tied ?? false,
        centre: x === 0 && y === 0,
      });
    }
    rows.push(row);
  }
  return rows;
}
