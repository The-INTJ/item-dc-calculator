/**
 * The starting position — the "spaced" layout. Black mirrors White across
 * the middle of the board, so the kings face each other on the d-file and
 * each starts on its own colour (d1 light, d8 dark).
 *
 *       a b c d e f g h
 *    8  . T . K . T . T
 *    7  . W . W . W . W
 *    2  . W . W . W . W
 *    1  . T . K . T . T
 */

import type { GameState, Piece, PieceKind, Side } from './types';

export const RULES_VERSION = 1;

interface Placement {
  id: string;
  kind: PieceKind;
  file: string;
  /** 0 = back rank, 1 = the rank in front of it. */
  row: 0 | 1;
}

export const STARTING_LAYOUT: readonly Placement[] = [
  { id: 'K', kind: 'king', file: 'd', row: 0 },
  { id: 'T1', kind: 'tracer', file: 'b', row: 0 },
  { id: 'T2', kind: 'tracer', file: 'f', row: 0 },
  { id: 'T3', kind: 'tracer', file: 'h', row: 0 },
  { id: 'W1', kind: 'warden', file: 'b', row: 1 },
  { id: 'W2', kind: 'warden', file: 'd', row: 1 },
  { id: 'W3', kind: 'warden', file: 'f', row: 1 },
  { id: 'W4', kind: 'warden', file: 'h', row: 1 },
];

function place(side: Side, placement: Placement): Piece {
  const rank = side === 'w' ? 1 + placement.row : 8 - placement.row;
  return {
    id: `${side}${placement.id}`,
    side,
    kind: placement.kind,
    at: `${placement.file}${rank}`,
    pattern: null,
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
    library: { w: [], b: [] },
    stepStreak: { w: 0, b: 0 },
    result: { status: 'active' },
  };
}
