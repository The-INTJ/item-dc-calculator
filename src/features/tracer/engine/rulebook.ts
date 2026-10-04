/**
 * The rulebook: every place a rule set changes how the engine behaves.
 *
 * Mechanics (charting, reach, turns, threats) never read `rules` directly;
 * they ask one of these functions for a parameter — a step limit, a pattern
 * list, a yes/no. Adding a rule means adding a switch here, so a rule can't
 * be honoured in one place and forgotten in another.
 */

import type { FreeStepRule, GameState, KingMemory, PatternCode, Piece, PieceKind, RuleSet, Side } from './types';
import { MAX_PATH_LENGTH } from './geometry';

// Every value of each choice rule. Built from records, so a value added to
// the type must be listed here — and the switches below must handle it.
const KING_MEMORY_VALUES: Record<KingMemory, true> = { none: true, current: true, 'current-kept': true, 'every-chart': true };
const FREE_STEP_VALUES: Record<FreeStepRule, true> = { off: true, 'with-tracer': true, 'with-tracer-or-warden': true };
export const KING_MEMORY = Object.keys(KING_MEMORY_VALUES) as readonly KingMemory[];
export const FREE_STEP = Object.keys(FREE_STEP_VALUES) as readonly FreeStepRule[];

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

/** The patterns `side`'s king may use besides its one-square step. */
export function kingPatterns(state: GameState, side: Side): PatternCode[] {
  const memory = state.rules.kingMemory;
  switch (memory) {
    case 'none':
      return [];
    case 'every-chart':
      return state.chartedKeys[side];
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
