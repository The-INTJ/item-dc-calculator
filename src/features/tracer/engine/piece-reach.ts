/**
 * Where each kind of piece can go with a `move` main action.
 *
 * Warden: one step any direction. Tracer: its current pattern (nothing while
 * unformed), then — where the rules allow — a quiet one-square step. King:
 * its base one-step, then each pattern it may move by. When several sources
 * reach the same square, the first one wins.
 */

import type { MoveSource, PatternCode, Piece, Side, StepString } from './types';
import { neighbours, parseSquare } from './geometry';
import { relation, type Board } from './occupancy';
import { patternReach, type PatternHit } from './pattern-reach';
import type { Reach } from './rulebook';

export interface Hit {
  sq: number;
  capture: boolean;
  via: MoveSource;
  path: StepString | null;
  /** A move that can never capture (a Tracer's step), so it threatens nothing. */
  quiet: boolean;
}

function baseStepHits(board: Board, from: number, side: Side): Hit[] {
  const hits: Hit[] = [];
  for (const sq of neighbours(from)) {
    const rel = relation(board, sq, side);
    if (rel !== 'own') hits.push({ sq, capture: rel === 'enemy', via: 'base', path: null, quiet: false });
  }
  return hits;
}

function quietStepHits(board: Board, from: number): Hit[] {
  return neighbours(from)
    .filter((sq) => board[sq] === null)
    .map((sq) => ({ sq, capture: false, via: 'base', path: null, quiet: true }));
}

function withSource(hits: PatternHit[], via: PatternCode): Hit[] {
  return hits.map((hit) => ({ ...hit, via, quiet: false }));
}

function firstPerSquare(hits: Hit[]): Hit[] {
  const bySquare = new Map<number, Hit>();
  for (const hit of hits) if (!bySquare.has(hit.sq)) bySquare.set(hit.sq, hit);
  return [...bySquare.values()];
}

function patternHits(board: Board, from: number, side: Side, pattern: PatternCode, reach: Reach): Hit[] {
  return withSource(patternReach(board, from, side, pattern, reach.tracedOnly).hits, pattern);
}

/** Every square `piece` can move to, given its side's `reach`. */
export function pieceHits(board: Board, piece: Piece, reach: Reach): Hit[] {
  const from = parseSquare(piece.at);
  if (from === null) return [];
  switch (piece.kind) {
    case 'warden':
      return baseStepHits(board, from, piece.side);
    case 'tracer': {
      const strikes = piece.pattern ? patternHits(board, from, piece.side, piece.pattern, reach) : [];
      return firstPerSquare([...strikes, ...(reach.tracerStep ? quietStepHits(board, from) : [])]);
    }
    case 'king': {
      const borrowed = reach.kingPatterns.flatMap((pattern) => patternHits(board, from, piece.side, pattern, reach));
      return firstPerSquare([...baseStepHits(board, from, piece.side), ...borrowed]);
    }
  }
}
