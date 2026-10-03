/**
 * Read-only questions the UI asks about a position, in square names.
 */

import type { GameState, MoveTarget, PatternCode, RiderWalk, Side, SquareName, StepString } from './types';
import {
  fileOf,
  isStepString,
  parseSquare,
  rankOf,
  squareAt,
  squareName,
  stepFrom,
  vectorDigit,
} from './geometry';
import { boardOf, findKing } from './occupancy';
import { pieceHits } from './piece-reach';
import { patternReach } from './pattern-reach';
import { cloneState } from './turn';

export function pieceAt(state: GameState, at: SquareName) {
  return state.pieces.find((piece) => piece.at === at) ?? null;
}

/** Where the piece on `from` can go with a `move` main action. */
export function moveTargets(state: GameState, from: SquareName): MoveTarget[] {
  const piece = pieceAt(state, from);
  if (!piece) return [];
  const board = boardOf(state.pieces);
  return pieceHits(board, piece, state.library[piece.side]).map((hit) => ({
    to: squareName(hit.sq),
    capture: hit.capture,
    via: hit.via,
    path: hit.path,
  }));
}

/** What `pattern` would reach from `from` for `side`, with rider ghost rays. */
export function patternTargets(
  state: GameState,
  from: SquareName,
  side: Side,
  pattern: PatternCode,
): { targets: MoveTarget[]; walks: RiderWalk[] } {
  const sq = parseSquare(from);
  if (sq === null) return { targets: [], walks: [] };
  const reach = patternReach(boardOf(state.pieces), sq, side, pattern);
  return {
    targets: reach.hits.map((hit) => ({
      to: squareName(hit.sq),
      capture: hit.capture,
      via: pattern,
      path: hit.path,
    })),
    walks: reach.walks,
  };
}

/**
 * The position after `side`'s king steps to `to`, for previewing the rest of a
 * turn. Does not validate — the composer only offers legal steps — and does
 * not advance the ply.
 */
export function withKingAt(state: GameState, side: Side, to: SquareName): GameState {
  const next = cloneState(state);
  const king = findKing(next.pieces, side);
  if (king) king.at = to;
  return next;
}

/** The squares a path visits from `from`, stopping if it would leave the board. */
export function pathSquares(from: SquareName, steps: StepString): SquareName[] {
  let current = parseSquare(from);
  const squares: SquareName[] = [];
  for (const digit of steps) {
    if (current === null || !isStepString(digit)) break;
    current = stepFrom(current, digit);
    if (current === null) break;
    squares.push(squareName(current));
  }
  return squares;
}

/** The direction digit for one step from `from` to `to`, or null if not adjacent. */
export function stepDigit(from: SquareName, to: SquareName): string | null {
  const a = parseSquare(from);
  const b = parseSquare(to);
  if (a === null || b === null) return null;
  return vectorDigit(fileOf(b) - fileOf(a), rankOf(b) - rankOf(a));
}

export function squareCoords(name: SquareName): { file: number; rank: number } | null {
  const sq = parseSquare(name);
  return sq === null ? null : { file: fileOf(sq), rank: rankOf(sq) };
}

export function squareFromCoords(file: number, rank: number): SquareName | null {
  const sq = squareAt(file, rank);
  return sq === null ? null : squareName(sq);
}
