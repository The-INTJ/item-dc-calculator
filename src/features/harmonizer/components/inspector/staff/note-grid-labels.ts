/**
 * What each cell of the note grid announces.
 *
 * A cell's drawing is decorative, so its label is all a screen reader has to go
 * on. It names the MOVE rather than the destination — "two sixteenths longer",
 * not "a dotted quarter on D" — because the grid re-centres after every choice,
 * and the move is the part that stays true wherever you have got to.
 */

import { content } from '../../../content';
import type { GridCell } from './note-grid-cells';

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function pitchPhrase(steps: number): string {
  const { halfStep, halfSteps, higher, lower } = content.noteGrid;
  return `${counted(Math.abs(steps), halfStep, halfSteps)} ${steps > 0 ? higher : lower}`;
}

function lengthPhrase(steps: number): string {
  const { sixteenth, sixteenths, longer, shorter } = content.noteGrid;
  return `${counted(Math.abs(steps), sixteenth, sixteenths)} ${steps > 0 ? longer : shorter}`;
}

/** One cell, in words. */
export function cellLabel(cell: GridCell): string {
  if (cell.centre) return content.noteGrid.keep;
  if (!cell.value) return content.noteGrid.unavailable;
  const pitch = cell.y === 0 ? content.noteGrid.samePitch : pitchPhrase(cell.y);
  const length = cell.x === 0 ? content.noteGrid.sameLength : lengthPhrase(cell.x);
  return cell.tied ? `${pitch}, ${length}, ${content.noteGrid.tied}` : `${pitch}, ${length}`;
}
