/**
 * A 64-cell view of who stands where, built from a piece list.
 */

import type { Piece, Side } from './types';
import { parseSquare, SQUARE_COUNT } from './geometry/squares';

export type Board = ReadonlyArray<Piece | null>;

export type Relation = 'empty' | 'own' | 'enemy';

export function otherSide(side: Side): Side {
  return side === 'w' ? 'b' : 'w';
}

export function boardOf(pieces: readonly Piece[]): Board {
  const board: (Piece | null)[] = new Array<Piece | null>(SQUARE_COUNT).fill(null);
  for (const piece of pieces) {
    const sq = parseSquare(piece.at);
    if (sq !== null) board[sq] = piece;
  }
  return board;
}

export function relation(board: Board, sq: number, side: Side): Relation {
  const piece = board[sq];
  if (!piece) return 'empty';
  return piece.side === side ? 'own' : 'enemy';
}

export function findKing(pieces: readonly Piece[], side: Side): Piece | null {
  return pieces.find((piece) => piece.side === side && piece.kind === 'king') ?? null;
}
