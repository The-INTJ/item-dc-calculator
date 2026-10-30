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
import { boardOf, findKing } from './occupancy';
import { canonicalKey } from './pattern-codes';
import { pieceHits } from './piece-reach';
import { walkChart, type ChartWalk } from './chart';
import { hasLegalMainAction } from './legality';
import { chartLimit, kingDeclares, kingPatterns, landsAnywhere, reachFor } from './rulebook';

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
  const reach = reachFor(work, side);
  if (piece.kind === 'tracer' && !piece.pattern && !reach.tracerStep) return fail('UNFORMED_TRACER');
  const board = boardOf(work.pieces);
  const hit = pieceHits(board, piece, reach).find((h) => squareName(h.sq) === to);
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
 * the pattern in the side's lists of everything charted (by canonical key,
 * and exactly as charted).
 */
function recordChart(work: GameState, side: Side, tracerId: string, pattern: string): void {
  work.lastCharted = { ...work.lastCharted, [side]: { ...work.lastCharted[side], [tracerId]: pattern } };
  const key = canonicalKey(pattern);
  if (!work.chartedKeys[side].includes(key)) {
    work.chartedKeys = { ...work.chartedKeys, [side]: [...work.chartedKeys[side], key] };
  }
  if (!work.chartedCodes[side].includes(pattern)) {
    work.chartedCodes = { ...work.chartedCodes, [side]: [...work.chartedCodes[side], pattern] };
  }
}

/** Where a charting Tracer stops: `land` steps along its path (0 = where it started). */
function landing(work: GameState, origin: number, walk: Extract<ChartWalk, { ok: true }>, land: number | undefined): number | EngineErrorCode {
  const steps = walk.squares.length;
  const at = land ?? steps;
  if (!Number.isInteger(at) || at < 0 || at > steps) return 'LANDING_OFF_PATH';
  if (at === steps) return walk.to;
  if (!landsAnywhere(work.rules)) return 'LANDING_NOT_ALLOWED';
  if (at === 0) return origin;
  const square = walk.squares[at - 1];
  return boardOf(work.pieces)[square] === null ? square : 'LANDING_OCCUPIED';
}

function applyChart(work: GameState, side: Side, from: SquareName, steps: string, land: number | undefined): MainResult {
  const piece = ownPieceAt(work, side, from);
  if (typeof piece === 'string') return fail(piece);
  if (piece.kind !== 'tracer') return fail('NOT_A_TRACER');
  const limit = chartLimit(work.rules, piece);
  const origin = parseSquare(from) as number;
  const walk = walkChart(boardOf(work.pieces), origin, steps, limit);
  if (!walk.ok) return fail(walk.code);
  const stop = landing(work, origin, walk, land);
  if (typeof stop === 'string') return fail(stop);
  piece.at = squareName(stop);
  piece.pattern = walk.pattern;
  recordChart(work, side, piece.id, walk.pattern);
  return {
    ok: true,
    captured: null,
    record: { kind: 'chart', pieceId: piece.id, from, to: piece.at, steps, pattern: walk.pattern },
  };
}

/** The king picks one of the patterns it may borrow, to move by on later turns. */
function applyDeclare(work: GameState, side: Side, pattern: string): MainResult {
  if (!kingDeclares(work.rules)) return fail('DECLARE_NOT_ALLOWED');
  const king = findKing(work.pieces, side);
  if (!king) return fail('NO_PIECE');
  if (!kingPatterns(work, side).includes(pattern)) return fail('NOT_DECLARABLE');
  king.pattern = pattern;
  return { ok: true, captured: null, record: { kind: 'declare', pieceId: king.id, at: king.at, pattern } };
}

export function applyMainAction(work: GameState, side: Side, main: MainAction): MainResult {
  switch (main.kind) {
    case 'move':
      return applyMove(work, side, main.from, main.to);
    case 'chart':
      return applyChart(work, side, main.from, main.steps, main.land);
    case 'declare':
      return applyDeclare(work, side, main.pattern);
    case 'pass':
      return hasLegalMainAction(work, side)
        ? fail('PASS_NOT_ALLOWED')
        : { ok: true, captured: null, record: { kind: 'pass' } };
  }
}
