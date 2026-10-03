/**
 * The starting position. Black mirrors White across the middle of the board,
 * the way chess does: the 8-step Tracer starts on its own colour (d1 light,
 * d8 dark) beside the king, with two Wardens in front of them, and the other
 * two Tracers sit on the flanks behind a Warden each.
 *
 *       a b c d e f g h
 *    8  . 3 . 8 K . 5 .
 *    7  . W . W W . W .
 *    2  . W . W W . W .
 *    1  . 3 . 8 K . 5 .
 *
 * Tracers are named for their step limit: `T3` charts at most 3 squares,
 * `T5` at most 5, `T8` at most 8.
 */

import type { GameState, Piece, PieceKind, Side } from './types';

export const RULES_VERSION = 2;

interface Placement {
  id: string;
  kind: PieceKind;
  file: string;
  /** 0 = back rank, 1 = the rank in front of it. */
  row: 0 | 1;
  /** Tracers only: the step limit. */
  range: number | null;
}

export const STARTING_LAYOUT: readonly Placement[] = [
  { id: 'K', kind: 'king', file: 'e', row: 0, range: null },
  { id: 'T3', kind: 'tracer', file: 'b', row: 0, range: 3 },
  { id: 'T8', kind: 'tracer', file: 'd', row: 0, range: 8 },
  { id: 'T5', kind: 'tracer', file: 'g', row: 0, range: 5 },
  { id: 'W1', kind: 'warden', file: 'b', row: 1, range: null },
  { id: 'W2', kind: 'warden', file: 'd', row: 1, range: null },
  { id: 'W3', kind: 'warden', file: 'e', row: 1, range: null },
  { id: 'W4', kind: 'warden', file: 'g', row: 1, range: null },
];

function place(side: Side, placement: Placement): Piece {
  const rank = side === 'w' ? 1 + placement.row : 8 - placement.row;
  return {
    id: `${side}${placement.id}`,
    side,
    kind: placement.kind,
    at: `${placement.file}${rank}`,
    pattern: null,
    range: placement.range,
  };
}

export function initialState(): GameState {
  return {
    rulesVersion: RULES_VERSION,
    ply: 0,
    pieces: [
      ...STARTING_LAYOUT.map((placement) => place('w', placement)),
      ...STARTING_LAYOUT.map((placement) => place('b', placement)),
    ],
    kingPatterns: { w: {}, b: {} },
    stepStreak: { w: 0, b: 0 },
    result: { status: 'active' },
  };
}
