/**
 * The rulebook: every place a rule set changes how the engine behaves.
 *
 * Mechanics (charting, reach, turns, threats) never read `rules` directly;
 * they ask one of these functions for a parameter — a step limit, a pattern
 * list, a yes/no. Adding a rule means adding a switch here, so a rule can't
 * be honoured in one place and forgotten in another.
 */

import type {
  ChartLanding,
  FreeStepRule,
  GameState,
  KingBorrow,
  KingMemory,
  PatternCode,
  PatternOrientations,
  Piece,
  PieceKind,
  RuleSet,
  Side,
} from './types';
import { MAX_PATH_LENGTH } from './geometry';
import { findKing } from './occupancy';

// Every value of each choice rule. Built from records, so a value added to
// the type must be listed here — and the switches below must handle it.
const KING_MEMORY_VALUES: Record<KingMemory, true> = { none: true, current: true, 'current-kept': true, 'every-chart': true };
const FREE_STEP_VALUES: Record<FreeStepRule, true> = { off: true, 'with-tracer': true, 'with-tracer-or-warden': true };
const ORIENTATION_VALUES: Record<PatternOrientations, true> = { all: true, 'as-traced': true };
const LANDING_VALUES: Record<ChartLanding, true> = { end: true, any: true };
const KING_BORROW_VALUES: Record<KingBorrow, true> = { 'any-time': true, declared: true };
export const KING_MEMORY = Object.keys(KING_MEMORY_VALUES) as readonly KingMemory[];
export const FREE_STEP = Object.keys(FREE_STEP_VALUES) as readonly FreeStepRule[];
export const PATTERN_ORIENTATIONS = Object.keys(ORIENTATION_VALUES) as readonly PatternOrientations[];
export const CHART_LANDING = Object.keys(LANDING_VALUES) as readonly ChartLanding[];
export const KING_BORROW = Object.keys(KING_BORROW_VALUES) as readonly KingBorrow[];

function unhandled(value: never): never {
  throw new Error(`Unhandled rule value: ${String(value)}`);
}

/** The most squares `piece` may chart in one go. */
export function chartLimit(rules: RuleSet, piece: Pick<Piece, 'kind' | 'tier'>): number {
  if (piece.kind !== 'tracer' || piece.tier === null || !rules.tracerReach.limited) return MAX_PATH_LENGTH;
  return rules.tracerReach.limits[piece.tier] ?? MAX_PATH_LENGTH;
}

/** Whether `rules` limits `piece` at all — for showing a limit on screen. */
export function hasChartLimit(rules: RuleSet, piece: Pick<Piece, 'kind' | 'tier'>): boolean {
  return chartLimit(rules, piece) < MAX_PATH_LENGTH;
}

/** Patterns apply only exactly as traced, never turned or mirrored. */
export function tracedOnly(rules: RuleSet): boolean {
  return rules.patternOrientations === 'as-traced';
}

/** A charting Tracer may stop anywhere along its path, or stay put. */
export function landsAnywhere(rules: RuleSet): boolean {
  return rules.chartLanding === 'any';
}

/** The king must declare a borrowed pattern on one turn to move by it on later ones. */
export function kingDeclares(rules: RuleSet): boolean {
  return rules.kingBorrow === 'declared';
}

/**
 * The patterns `side`'s king may borrow besides its one-square step: move by
 * any time, or — where kings declare — pick one from to declare.
 */
export function kingPatterns(state: GameState, side: Side): PatternCode[] {
  const memory = state.rules.kingMemory;
  switch (memory) {
    case 'none':
      return [];
    case 'every-chart':
      return tracedOnly(state.rules) ? state.chartedCodes[side] : state.chartedKeys[side];
    case 'current':
      return state.pieces
        .filter((piece) => piece.side === side && piece.kind === 'tracer' && piece.pattern !== null)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .map((piece) => piece.pattern as PatternCode);
    case 'current-kept': {
      const lent = state.lastCharted[side];
      return Object.keys(lent)
        .sort()
        .map((tracerId) => lent[tracerId]);
    }
    default:
      return unhandled(memory);
  }
}

/** The patterns `side`'s king may move by right now. */
export function kingMoves(state: GameState, side: Side): PatternCode[] {
  if (!kingDeclares(state.rules)) return kingPatterns(state, side);
  const declared = findKing(state.pieces, side)?.pattern ?? null;
  return declared ? [declared] : [];
}

/** Everything that shapes where `side`'s pieces can move this turn. */
export interface Reach {
  kingPatterns: readonly PatternCode[];
  tracedOnly: boolean;
  tracerStep: boolean;
}

export function reachFor(state: GameState, side: Side): Reach {
  return { kingPatterns: kingMoves(state, side), tracedOnly: tracedOnly(state.rules), tracerStep: state.rules.tracerStep };
}

/** May a main move by a `kind` piece take the free king step along? */
export function stepCombinesWith(rules: RuleSet, kind: PieceKind): boolean {
  const rule = rules.freeStep;
  switch (rule) {
    case 'off':
      return false;
    case 'with-tracer':
      return kind === 'tracer';
    case 'with-tracer-or-warden':
      return kind === 'tracer' || kind === 'warden';
    default:
      return unhandled(rule);
  }
}

/** Dodges in a row that draw the game, or null when that never happens. */
export function dodgeLimit(rules: RuleSet): number | null {
  return rules.dodgeDraw > 0 ? rules.dodgeDraw : null;
}

/**
 * Whether a turn counts toward the dodge draw: it took the free king step —
 * and, where the rules say dodges need a threat, the king was threatened as
 * the turn began. `threatened` is only asked when the answer matters.
 */
export function isDodge(rules: RuleSet, tookStep: boolean, threatened: () => boolean): boolean {
  if (!tookStep || dodgeLimit(rules) === null) return false;
  return !rules.dodgeNeedsThreat || threatened();
}

export function loneKingWins(rules: RuleSet): boolean {
  return rules.loneKingWins;
}
