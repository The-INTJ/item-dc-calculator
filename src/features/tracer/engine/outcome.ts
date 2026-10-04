/**
 * How games end.
 *
 * - Capturing the enemy king wins on the spot.
 * - A capture that leaves the opponent with only its king wins ("lone king"),
 *   when the rules say so.
 * - Dodge streak: taking the free king step on N of your own turns in a row
 *   (N from the rules), with no capture by either side meanwhile, draws the
 *   game. A turn without the free step resets that player's count; any
 *   capture resets both counts.
 * - Resignation and agreed draws come from outside the turn flow.
 */

import type { GameResult, GameState, Piece, RuleSet, Side } from './types';
import { otherSide } from './occupancy';
import { dodgeLimit, loneKingWins } from './rulebook';

export function captureResult(
  work: GameState,
  mover: Side,
  captured: Piece | null,
  atPly: number,
): GameResult | null {
  if (!captured) return null;
  if (captured.kind === 'king') {
    return { status: 'won', winner: mover, reason: 'king-capture', atPly };
  }
  if (!loneKingWins(work.rules)) return null;
  const opponent = otherSide(mover);
  const hasArmy = work.pieces.some((piece) => piece.side === opponent && piece.kind !== 'king');
  return hasArmy ? null : { status: 'won', winner: mover, reason: 'lone-king', atPly };
}

export function nextStepStreak(
  streak: Record<Side, number>,
  mover: Side,
  tookStep: boolean,
  captured: boolean,
): Record<Side, number> {
  if (captured) return { w: 0, b: 0 };
  return { ...streak, [mover]: tookStep ? streak[mover] + 1 : 0 };
}

export function streakResult(
  rules: RuleSet,
  streak: Record<Side, number>,
  mover: Side,
  atPly: number,
): GameResult | null {
  const limit = dodgeLimit(rules);
  return limit !== null && streak[mover] >= limit
    ? { status: 'drawn', reason: 'step-streak', atPly }
    : null;
}

/** `side` resigns. Has no effect on a finished game. */
export function resign(state: GameState, side: Side): GameState {
  if (state.result.status !== 'active') return state;
  return {
    ...state,
    result: { status: 'won', winner: otherSide(side), reason: 'resignation', atPly: state.ply },
  };
}

/** Both players agreed to a draw. Has no effect on a finished game. */
export function agreeDraw(state: GameState): GameState {
  if (state.result.status !== 'active') return state;
  return { ...state, result: { status: 'drawn', reason: 'agreement', atPly: state.ply } };
}
