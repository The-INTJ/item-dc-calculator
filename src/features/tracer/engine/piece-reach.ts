/**
 * Where each kind of piece can go with a `move` main action.
 *
 * Warden: one step any direction. Tracer: its current pattern (nothing while
 * unformed). King: its base one-step, then every library pattern in the order
 * learned. When several sources reach the same square, the first one wins.
 */

import type { MoveSource, PatternCode, Piece, Side, StepString } from './types';
import { neighbours, parseSquare } from './geometry';
import { relation, type Board } from './occupancy';
import { patternReach, type PatternHit } from './pattern-reach';

export interface Hit {
  sq: number;
  capture: boolean;
  via: MoveSource;
  path: StepString | null;
}

function baseStepHits(board: Board, from: number, side: Side): Hit[] {
  const hits: Hit[] = [];
  for (const sq of neighbours(from)) {
    const rel = relation(board, sq, side);
    if (rel !== 'own') hits.push({ sq, capture: rel === 'enemy', via: 'base', path: null });
  }
  return hits;
}

function withSource(hits: PatternHit[], via: PatternCode): Hit[] {
  return hits.map((hit) => ({ ...hit, via }));
}

function kingHits(
  board: Board,
  from: number,
  side: Side,
  library: readonly PatternCode[],
): Hit[] {
  const bySquare = new Map<number, Hit>();
  const add = (hit: Hit) => {
    if (!bySquare.has(hit.sq)) bySquare.set(hit.sq, hit);
  };
  baseStepHits(board, from, side).forEach(add);
  for (const key of library) {
    withSource(patternReach(board, from, side, key).hits, key).forEach(add);
  }
  return [...bySquare.values()];
}

/** Every square `piece` can move to. `library` is its side's king library. */
export function pieceHits(
  board: Board,
  piece: Piece,
  library: readonly PatternCode[],
): Hit[] {
  const from = parseSquare(piece.at);
  if (from === null) return [];
  switch (piece.kind) {
    case 'warden':
      return baseStepHits(board, from, piece.side);
    case 'tracer':
      return piece.pattern
        ? withSource(patternReach(board, from, piece.side, piece.pattern).hits, piece.pattern)
        : [];
    case 'king':
      return kingHits(board, from, piece.side, library);
  }
}
