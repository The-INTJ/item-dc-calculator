/**
 * Does a side have any legal main action at all?
 *
 * With the standard layouts the answer is effectively always yes, but the
 * engine checks rather than assumes, so tight step limits or future variants
 * with fixed obstacles keep `pass` honest.
 */

import type { GameState, Side } from './types';
import { neighbours, parseSquare } from './geometry';
import { boardOf, type Board } from './occupancy';
import { pieceHits } from './piece-reach';
import { chartLimit, kingDeclares, kingPatterns, reachFor } from './rulebook';

/**
 * True when some path of at most `limit` king steps from `from` can end on an
 * empty square. Breadth-first, so the first empty square found is the nearest.
 */
export function canChart(board: Board, from: number, limit: number): boolean {
  const seen = new Set<number>([from]);
  let frontier = [from];
  for (let depth = 1; depth <= limit && frontier.length > 0; depth += 1) {
    const next: number[] = [];
    for (const current of frontier) {
      for (const square of neighbours(current)) {
        if (seen.has(square)) continue;
        if (board[square] === null) return true;
        seen.add(square);
        next.push(square);
      }
    }
    frontier = next;
  }
  return false;
}

export function hasLegalMainAction(state: GameState, side: Side): boolean {
  const board = boardOf(state.pieces);
  const reach = reachFor(state, side);
  return state.pieces.some((piece) => {
    if (piece.side !== side) return false;
    const from = parseSquare(piece.at);
    if (piece.kind === 'tracer' && from !== null && canChart(board, from, chartLimit(state.rules, piece))) {
      return true;
    }
    if (piece.kind === 'king' && kingDeclares(state.rules) && kingPatterns(state, side).length > 0) return true;
    return pieceHits(board, piece, reach).length > 0;
  });
}
