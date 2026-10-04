/**
 * Applying a turn's one main action to a mutable working copy of the state.
 */

import type {
  ActionRecord,
  EngineErrorCode,
  GameState,
  MainAction,
  Piece,
  Side,
  SquareName,
} from './types';
import { parseSquare, squareName } from './geometry';
import { boardOf } from './occupancy';
import { canonicalKey } from './pattern-codes';
import { pieceHits } from './piece-reach';
import { walkChart } from './chart';
import { hasLegalMainAction } from './legality';
import { chartLimit, kingPatterns } from './rulebook';

export type MainResult =
  | { ok: true; record: ActionRecord; captured: Piece | null }
  | { ok: false; code: EngineErrorCode };

function fail(code: EngineErrorCode): MainResult {
  return { ok: false, code };
}

function ownPieceAt(work: GameState, side: Side, at: SquareName): Piece | EngineErrorCode {
  if (parseSquare(at) === null) return 'BAD_SQUARE';
  const piece = work.pieces.find((candidate) => candidate.at === at);
  if (!piece) return 'NO_PIECE';
  return piece.side === side ? piece : 'NOT_YOUR_PIECE';
}

function moveKind(piece: Piece): 'warden' | 'strike' | 'king' {
  if (piece.kind === 'warden') return 'warden';
  return piece.kind === 'tracer' ? 'strike' : 'king';
}

function applyMove(work: GameState, side: Side, from: SquareName, to: SquareName): MainResult {
  const piece = ownPieceAt(work, side, from);
  if (typeof piece === 'string') return fail(piece);
  if (parseSquare(to) === null) return fail('BAD_SQUARE');
  if (piece.kind === 'tracer' && !piece.pattern) return fail('UNFORMED_TRACER');
  const board = boardOf(work.pieces);
  const hit = pieceHits(board, piece, kingPatterns(work, side)).find((h) => squareName(h.sq) === to);
  if (!hit) return fail('UNREACHABLE');
  const victim = board[hit.sq];
  if (victim) work.pieces = work.pieces.filter((candidate) => candidate !== victim);
  piece.at = to;
  return {
    ok: true,
    captured: victim,
    record: {
      kind: moveKind(piece),
      pieceId: piece.id,
      from,
      to,
      via: hit.via,
      path: hit.path,
      captured: victim ? { id: victim.id, kind: victim.kind } : null,
    },
  };
}

/**
 * Record the facts any rule set might use: this Tracer's latest pattern, and
 * the pattern's canonical key in the side's list of everything charted.
 */
function recordChart(work: GameState, side: Side, tracerId: string, pattern: string): void {
  work.lastCharted = { ...work.lastCharted, [side]: { ...work.lastCharted[side], [tracerId]: pattern } };
  const key = canonicalKey(pattern);
  if (!work.chartedKeys[side].includes(key)) {
    work.chartedKeys = { ...work.chartedKeys, [side]: [...work.chartedKeys[side], key] };
  }
}

function applyChart(work: GameState, side: Side, from: SquareName, steps: string): MainResult {
  const piece = ownPieceAt(work, side, from);
  if (typeof piece === 'string') return fail(piece);
  if (piece.kind !== 'tracer') return fail('NOT_A_TRACER');
  const limit = chartLimit(work.rules, piece);
  const walk = walkChart(boardOf(work.pieces), parseSquare(from) as number, steps, limit);
  if (!walk.ok) return fail(walk.code);
  piece.at = squareName(walk.to);
  piece.pattern = walk.pattern;
  recordChart(work, side, piece.id, walk.pattern);
  return {
    ok: true,
    captured: null,
    record: { kind: 'chart', pieceId: piece.id, from, to: piece.at, steps, pattern: walk.pattern },
  };
}

export function applyMainAction(work: GameState, side: Side, main: MainAction): MainResult {
  switch (main.kind) {
    case 'move':
      return applyMove(work, side, main.from, main.to);
    case 'chart':
      return applyChart(work, side, main.from, main.steps);
    case 'pass':
      return hasLegalMainAction(work, side)
        ? fail('PASS_NOT_ALLOWED')
        : { ok: true, captured: null, record: { kind: 'pass' } };
  }
}
