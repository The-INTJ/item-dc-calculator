/**
 * Applying a whole turn. A turn is one of:
 *
 *   - a piece turn: one tracer or warden move, plus an optional free king
 *     step before or after it;
 *   - a king turn: one king move (base step or library pattern), alone.
 *
 * `applyTurn` is pure: it validates against `state`, works on a clone, and
 * returns the next state with a record of what happened — or the first
 * reason the turn is illegal. The same function runs in the browser for
 * previews and on the server as the authority.
 */

import type { ActionRecord, FreeStep, GameState, MainAction, Side, TurnInput, TurnOutcome } from './types';
import { findKing } from './occupancy';
import { applyFreeStep } from './free-step';
import { applyMainAction } from './main-action';
import { captureResult, nextStepStreak, streakResult } from './outcome';
import { turnFailure } from './engine-error';
import { isTurnInput } from './turn-input';

export function sideToMove(state: GameState): Side {
  return state.ply % 2 === 0 ? 'w' : 'b';
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    pieces: state.pieces.map((piece) => ({ ...piece })),
    library: { w: [...state.library.w], b: [...state.library.b] },
    stepStreak: { ...state.stepStreak },
    result: { ...state.result },
  };
}

/** Would `main` move the king (counting a free step taken just before it)? */
function movesKing(state: GameState, side: Side, main: MainAction, step: FreeStep): boolean {
  if (main.kind !== 'move') return false;
  const king = findKing(state.pieces, side);
  if (!king) return false;
  return main.from === king.at || (step.when === 'before' && main.from === step.to);
}

function guard(state: GameState, side: Side, input: unknown): TurnOutcome | null {
  if (!isTurnInput(input)) return turnFailure('BAD_INPUT', 'turn');
  if (state.result.status !== 'active') return turnFailure('GAME_OVER', 'turn');
  if (side !== sideToMove(state)) return turnFailure('NOT_YOUR_TURN', 'turn');
  if (input.ply !== state.ply) return turnFailure('STALE_PLY', 'turn');
  if (input.freeStep && movesKing(state, side, input.main, input.freeStep)) {
    return turnFailure('STEP_WITH_KING_MOVE', 'turn');
  }
  return null;
}

export function applyTurn(state: GameState, side: Side, input: TurnInput): TurnOutcome {
  const rejected = guard(state, side, input);
  if (rejected) return rejected;
  const work = cloneState(state);
  const actions: ActionRecord[] = [];
  const step = input.freeStep;

  if (step?.when === 'before') {
    const stepped = applyFreeStep(work, side, step.to);
    if (typeof stepped === 'string') return turnFailure(stepped, 'before');
    actions.push(stepped);
  }

  const main = applyMainAction(work, side, input.main);
  if (!main.ok) return turnFailure(main.code, 'main');
  actions.push(main.record);
  const won = captureResult(work, side, main.captured, state.ply);

  if (step?.when === 'after') {
    if (won) return turnFailure('STEP_AFTER_WIN', 'after');
    const stepped = applyFreeStep(work, side, step.to);
    if (typeof stepped === 'string') return turnFailure(stepped, 'after');
    actions.push(stepped);
  }

  work.stepStreak = nextStepStreak(state.stepStreak, side, step !== null, main.captured !== null);
  work.result = won ?? streakResult(work.stepStreak, side, state.ply) ?? { status: 'active' };
  work.ply = state.ply + 1;
  return { ok: true, state: work, record: { ply: state.ply, side, actions, result: work.result } };
}
