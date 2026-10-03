/**
 * The free king step: one square to an adjacent EMPTY square, never a
 * capture. It rides along with a tracer or warden move, before or after it.
 */

import type { ActionRecord, EngineErrorCode, GameState, Side, SquareName } from './types';
import { isNeighbour, neighbours, parseSquare, squareName } from './geometry';
import { boardOf, findKing } from './occupancy';

export function freeStepSquares(state: GameState, side: Side): SquareName[] {
  const king = findKing(state.pieces, side);
  const from = king ? parseSquare(king.at) : null;
  if (from === null) return [];
  const board = boardOf(state.pieces);
  return neighbours(from)
    .filter((sq) => board[sq] === null)
    .map(squareName);
}

/**
 * Move `side`'s king one step on the mutable working state `work`.
 * Returns the action record, or the reason the step is illegal.
 */
export function applyFreeStep(
  work: GameState,
  side: Side,
  to: SquareName,
): ActionRecord | EngineErrorCode {
  const king = findKing(work.pieces, side);
  const from = king ? parseSquare(king.at) : null;
  if (!king || from === null) return 'NO_PIECE';
  const target = parseSquare(to);
  if (target === null) return 'BAD_SQUARE';
  if (!isNeighbour(from, target)) return 'STEP_NOT_ADJACENT';
  if (boardOf(work.pieces)[target] !== null) return 'STEP_NOT_EMPTY';
  const record: ActionRecord = { kind: 'step', from: king.at, to: squareName(target) };
  king.at = squareName(target);
  return record;
}
