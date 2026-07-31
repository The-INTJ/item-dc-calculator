/**
 * What the tap-to-edit grid offers around a note.
 *
 * The grid is a small map of nearby notes: length along x, pitch along y, with
 * the note you tapped in the middle. Reach is deliberately short — two steps —
 * because a grid wide enough for a dramatic leap would be unusable for the
 * ordinary nudge. Big moves are made by taking a second step: the grid stays
 * open and re-centres, so a leap is a few taps in the same direction rather
 * than a different gesture.
 */

import type { SpelledPitch, ScaleDegreePitch, TonalContext } from '../../../domain/music-types';
import { stepDiatonic } from '../../../domain/scale';
import { shapeForDegree, stepLength, writtenValue } from '../../../domain/notation';
import type { NotatedBase, ShapeId } from '../../../domain/notation';

export interface GridNote {
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  units: number;
}

export interface GridCell {
  /** Steps from the centre: x along the length ladder, y in scale steps. */
  x: number;
  y: number;
  /** Null when the ladder or the singable range runs out in that direction. */
  value: GridNote | null;
  shape: ShapeId | null;
  base: NotatedBase | null;
  dots: 0 | 1;
  centre: boolean;
}

/** Walks the scale `steps` rungs from a note; null once it leaves what a voice can sing. */
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
    const next = stepDiatonic(context, current, direction);
    if (!next) return null;
    current = next;
  }
  return current;
}

/**
 * The grid, row by row from the highest pitch down — the order it is drawn in,
 * so a higher note really does sit higher.
 */
export function buildGridCells(
  context: TonalContext,
  note: GridNote,
  reach: number,
): GridCell[][] {
  const rows: GridCell[][] = [];
  for (let y = reach; y >= -reach; y -= 1) {
    const row: GridCell[] = [];
    for (let x = -reach; x <= reach; x += 1) {
      const stepped = stepPitch(context, note, y);
      const units = stepLength(note.units, x);
      const written = units === null ? null : writtenValue(units);
      const reachable = stepped !== null && units !== null && written !== null;
      row.push({
        x,
        y,
        value: reachable ? { ...stepped, units } : null,
        shape: reachable ? shapeForDegree(context, stepped.scaleDegree.degree) : null,
        base: written?.base ?? null,
        dots: written?.dots ?? 0,
        centre: x === 0 && y === 0,
      });
    }
    rows.push(row);
  }
  return rows;
}
