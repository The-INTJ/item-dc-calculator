/**
 * Turning the staff model's musical coordinates into pixels.
 *
 * The model measures time in grid units and height in staff steps. Time becomes
 * a percentage, so the staff stretches with the same fluid grid the lanes use
 * and every note lines up with the chord row beneath it. Height becomes pixels
 * off one number — the staff space — because a stave that stretched vertically
 * would distort its own noteheads.
 */

import type { StaveId } from '../../../domain/notation';

/**
 * One staff space. Everything else here is a multiple of it, so this is the one
 * number to turn if the notation should read larger or smaller.
 */
export const SPACE_PX = 14;

/** The system, in staff spaces, top to bottom: margin, stave, gap, stave, margin. */
const TOP_MARGIN = 3;
const STAVE_HEIGHT = 4;
const STAVE_GAP = 5;
const BOTTOM_MARGIN = 3;

export const SYSTEM_SPACES =
  TOP_MARGIN + STAVE_HEIGHT + STAVE_GAP + STAVE_HEIGHT + BOTTOM_MARGIN;
export const SYSTEM_HEIGHT_PX = SYSTEM_SPACES * SPACE_PX;

/** Where each stave's top line sits, in staff spaces from the top of the system. */
const STAVE_TOP: Record<StaveId, number> = {
  treble: TOP_MARGIN,
  bass: TOP_MARGIN + STAVE_HEIGHT + STAVE_GAP,
};

/** A staff step's distance from the top of the system, in pixels. */
export function stepY(stave: StaveId, step: number): number {
  return (STAVE_TOP[stave] + step / 2) * SPACE_PX;
}

/** Notehead proportions, taken from the outlines themselves. */
export const HEAD_WIDTH_PX = 1.44 * SPACE_PX;
export const STEM_LENGTH_PX = 3.5 * SPACE_PX;
export const STEM_WIDTH_PX = 0.13 * SPACE_PX;
export const LEDGER_OVERHANG_PX = 0.28 * SPACE_PX;

/**
 * A dot sits in the space beside the note, never on a line — a dot centred on a
 * line would be lost in it. Notes on a line push their dot to the space above.
 */
export function dotStepFor(step: number): number {
  return step % 2 === 0 ? step - 1 : step;
}

/** Where a unit falls along the track, as a share of the measure's width. */
export function unitX(unit: number, gridUnits: number): string {
  return `${(unit / gridUnits) * 100}%`;
}

/** Nudge a position sideways by a fixed number of pixels, keeping it fluid. */
export function shiftX(x: string, px: number): string {
  return px === 0 ? x : `calc(${x} + ${px}px)`;
}
