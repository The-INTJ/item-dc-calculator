/**
 * The starting position for a rule set: its layout's pieces for White, and
 * the same pieces mirrored across the middle of the board for Black.
 */

import type { GameState, Piece, Placement, RuleSet, Side } from './types';

function place(side: Side, placement: Placement): Piece {
  const rank = side === 'w' ? 1 + placement.row : 8 - placement.row;
  return {
    id: `${side}${placement.id}`,
    side,
    kind: placement.kind,
    at: `${placement.file}${rank}`,
    pattern: null,
    tier: placement.kind === 'tracer' ? placement.tier : null,
  };
}

export function initialState(rules: RuleSet): GameState {
  const pieces = rules.layout.pieces;
  return {
    rules,
    ply: 0,
    pieces: [...pieces.map((p) => place('w', p)), ...pieces.map((p) => place('b', p))],
    lastCharted: { w: {}, b: {} },
    chartedKeys: { w: [], b: [] },
    chartedCodes: { w: [], b: [] },
    stepStreak: { w: 0, b: 0 },
    result: { status: 'active' },
  };
}
