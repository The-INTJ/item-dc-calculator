/**
 * Does a side have any legal main action at all?
 *
 * In v1 the answer is always yes while a tracer lives (some empty square is
 * always reachable by a path through pieces) and almost always otherwise, but
 * the engine checks rather than assumes, so future variants that add fixed
 * board obstacles keep `pass` honest.
 */

import type { GameState, Side } from './types';
import { neighbours, parseSquare } from './geometry';
import { boardOf, type Board } from './occupancy';
import { pieceHits } from './piece-reach';

/** True when some path of king steps from `from` can end on an empty square. */
export function canChart(board: Board, from: number): boolean {
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    for (const next of neighbours(current)) {
      if (seen.has(next)) continue;
      if (board[next] === null) return true;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

export function hasLegalMainAction(state: GameState, side: Side): boolean {
  const board = boardOf(state.pieces);
  return state.pieces.some((piece) => {
    if (piece.side !== side) return false;
    const from = parseSquare(piece.at);
    if (piece.kind === 'tracer' && from !== null && canChart(board, from)) return true;
    return pieceHits(board, piece, state.library[side]).length > 0;
  });
}
