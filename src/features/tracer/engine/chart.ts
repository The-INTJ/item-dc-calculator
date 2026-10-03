/**
 * Charting: validating and classifying a drawn path.
 *
 * A path is a chain of distinct king steps that never returns to its origin,
 * ends on an empty square, and is no longer than the Tracer's step limit.
 * Squares before the end may hold anything; if any of them is occupied the
 * result is a jumper, otherwise a rider.
 */

import type { GameState, PatternCode, SquareName, StepString } from './types';
import { isStepString, MAX_PATH_LENGTH, neighbours, parseSquare, squareName, stepFrom } from './geometry';
import { chartedPattern, patternKind } from './pattern-codes';
import { boardOf, type Board } from './occupancy';

export type ChartFailure =
  | 'BAD_STEPS'
  | 'CHART_OFF_BOARD'
  | 'CHART_REVISIT'
  | 'CHART_END_OCCUPIED'
  | 'CHART_TOO_LONG';

export type ChartWalk =
  | { ok: true; squares: number[]; to: number; pattern: PatternCode }
  | { ok: false; code: ChartFailure; atStep: number };

interface Traced {
  squares: number[];
  passedPiece: boolean;
  failure: { code: ChartFailure; atStep: number } | null;
}

/** Follow `steps` from `from`, noting whether any square before the last is occupied. */
function trace(board: Board, from: number, steps: StepString): Traced {
  const seen = new Set<number>([from]);
  const squares: number[] = [];
  let passedPiece = false;
  let current = from;
  for (let i = 0; i < steps.length; i += 1) {
    const next = stepFrom(current, steps[i]);
    if (next === null) return { squares, passedPiece, failure: { code: 'CHART_OFF_BOARD', atStep: i } };
    if (seen.has(next)) return { squares, passedPiece, failure: { code: 'CHART_REVISIT', atStep: i } };
    if (i < steps.length - 1 && board[next]) passedPiece = true;
    seen.add(next);
    squares.push(next);
    current = next;
  }
  return { squares, passedPiece, failure: null };
}

/** The step limit of the Tracer on `from` (no limit for anything else). */
export function chartRange(board: Board, from: number): number {
  return board[from]?.range ?? MAX_PATH_LENGTH;
}

export function walkChart(board: Board, from: number, steps: StepString): ChartWalk {
  if (!isStepString(steps)) return { ok: false, code: 'BAD_STEPS', atStep: 0 };
  const range = chartRange(board, from);
  if (steps.length > range) return { ok: false, code: 'CHART_TOO_LONG', atStep: range };
  const traced = trace(board, from, steps);
  if (traced.failure) return { ok: false, ...traced.failure };
  const to = traced.squares[traced.squares.length - 1];
  if (board[to]) return { ok: false, code: 'CHART_END_OCCUPIED', atStep: steps.length - 1 };
  return { ok: true, squares: traced.squares, to, pattern: chartedPattern(steps, traced.passedPiece) };
}

export interface ChartPreview {
  /** The squares drawn so far, in order. */
  squares: SquareName[];
  /** Squares that may be tapped next (none once the step limit is reached). */
  next: SquareName[];
  /** The most squares this Tracer may chart. */
  range: number;
  /** The path so far ends on an empty square and could be submitted. */
  canFinish: boolean;
  /** Some square drawn so far holds a piece (so a longer path will jump). */
  touchesPiece: boolean;
  /** What submitting now would produce, when `canFinish`. */
  kind: 'rider' | 'jumper' | null;
  pattern: PatternCode | null;
  /** Set when `steps` is not a valid partial path. */
  error: ChartFailure | null;
}

function nextTaps(board: Board, origin: number, squares: number[], range: number): SquareName[] {
  if (squares.length >= range) return [];
  const last = squares.length > 0 ? squares[squares.length - 1] : origin;
  const used = new Set([origin, ...squares]);
  return neighbours(last)
    .filter((sq) => !used.has(sq))
    .map(squareName);
}

/** Live feedback while a player taps out a chart. `steps` may be empty. */
export function previewChart(state: GameState, from: SquareName, steps: StepString): ChartPreview {
  const board = boardOf(state.pieces);
  const origin = parseSquare(from);
  const range = origin === null ? 0 : chartRange(board, origin);
  const empty: ChartPreview = {
    squares: [], next: [], range, canFinish: false, touchesPiece: false,
    kind: null, pattern: null, error: null,
  };
  if (origin === null) return { ...empty, error: 'BAD_STEPS' };
  if (steps === '') return { ...empty, next: nextTaps(board, origin, [], range) };
  if (!isStepString(steps)) return { ...empty, error: 'BAD_STEPS' };
  if (steps.length > range) return { ...empty, error: 'CHART_TOO_LONG' };
  const traced = trace(board, origin, steps);
  const squares = traced.squares.map(squareName);
  if (traced.failure) return { ...empty, squares, error: traced.failure.code };
  const last = traced.squares[traced.squares.length - 1];
  const touchesPiece = traced.passedPiece || board[last] !== null;
  const base = { ...empty, squares, touchesPiece, next: nextTaps(board, origin, traced.squares, range) };
  if (board[last] !== null) return base;
  const pattern = chartedPattern(steps, traced.passedPiece);
  return { ...base, canFinish: true, kind: patternKind(pattern), pattern };
}
