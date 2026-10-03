/**
 * The turn being built on screen, before it is submitted.
 *
 * A turn is staged in up to three parts — a quiet king step taken first, the
 * main action, a king step taken after — plus transient selection state (the
 * piece in hand and any chart being drawn). A quiet step staged with nothing
 * else stays "undecided": submitted alone it is a king turn; followed by a
 * piece move it becomes that move's free step.
 */

import type { FreeStep, GameState, MainAction, Side, SquareName, TurnInput } from '../../engine';

export type TracerMode = 'strike' | 'chart';

export interface ComposerState {
  stepBefore: SquareName | null;
  main: MainAction | null;
  stepAfter: SquareName | null;
  /** The piece in hand — or, when inspecting, any piece being looked at. */
  selected: SquareName | null;
  tracerMode: TracerMode;
  /** Chart digits drawn so far. */
  chart: string;
}

export const EMPTY_COMPOSER: ComposerState = {
  stepBefore: null,
  main: null,
  stepAfter: null,
  selected: null,
  tracerMode: 'strike',
  chart: '',
};

export type ComposerAction =
  | { type: 'select'; square: SquareName; tracerMode: TracerMode }
  | { type: 'deselect' }
  | { type: 'setTracerMode'; mode: TracerMode }
  | { type: 'chartStep'; digit: string }
  | { type: 'chartBack' }
  | { type: 'stageMain'; main: MainAction }
  | { type: 'stepBefore'; to: SquareName }
  | { type: 'stepAfter'; to: SquareName }
  | { type: 'undo' }
  | { type: 'reset' };

function undo(state: ComposerState): ComposerState {
  if (state.chart) return { ...state, chart: state.chart.slice(0, -1) };
  if (state.selected) return { ...state, selected: null };
  if (state.stepAfter) return { ...state, stepAfter: null };
  if (state.main) return { ...state, main: null };
  if (state.stepBefore) return { ...state, stepBefore: null };
  return state;
}

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.square, tracerMode: action.tracerMode, chart: '' };
    case 'deselect':
      return { ...state, selected: null, chart: '' };
    case 'setTracerMode':
      return { ...state, tracerMode: action.mode, chart: '' };
    case 'chartStep':
      return { ...state, chart: state.chart + action.digit };
    case 'chartBack':
      return { ...state, chart: state.chart.slice(0, -1) };
    case 'stageMain':
      return { ...state, main: action.main, selected: null, chart: '' };
    case 'stepBefore':
      return { ...state, stepBefore: action.to, selected: null };
    case 'stepAfter':
      return { ...state, stepAfter: action.to, selected: null };
    case 'undo':
      return undo(state);
    case 'reset':
      return EMPTY_COMPOSER;
  }
}

/** The staged turn as the engine expects it, or null when nothing is staged. */
export function turnFromComposer(state: ComposerState, game: GameState, side: Side): TurnInput | null {
  if (state.main) {
    let freeStep: FreeStep | null = null;
    if (state.stepBefore) freeStep = { to: state.stepBefore, when: 'before' };
    else if (state.stepAfter) freeStep = { to: state.stepAfter, when: 'after' };
    return { ply: game.ply, main: state.main, freeStep };
  }
  if (state.stepBefore) {
    const king = game.pieces.find((piece) => piece.side === side && piece.kind === 'king');
    if (!king) return null;
    return { ply: game.ply, main: { kind: 'move', from: king.at, to: state.stepBefore }, freeStep: null };
  }
  return null;
}
