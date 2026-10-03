/**
 * What a tap on a square means, given what is already staged. Pure, so the
 * whole interaction can be tested without rendering a board.
 */

import { pieceAt, stepDigit, type SquareName } from '../../engine';
import type { ComposerAction, ComposerState, TracerMode } from './composerState';
import type { ComposerView } from './composerView';

export interface TapContext {
  composer: ComposerState;
  view: ComposerView;
  canMove: boolean;
}

function selectAction(ctx: TapContext, square: SquareName): ComposerAction {
  const piece = pieceAt(ctx.view.board, square);
  if (!piece) return { type: 'deselect' };
  if (square === ctx.composer.selected) return { type: 'deselect' };
  const mode: TracerMode = piece.kind === 'tracer' && !piece.pattern ? 'chart' : 'strike';
  return { type: 'select', square, tracerMode: mode };
}

function chartTap(ctx: TapContext, square: SquareName): ComposerAction | null {
  const { chart } = ctx.view;
  const origin = ctx.composer.selected;
  if (!chart || !origin) return null;
  const last = chart.squares.length > 0 ? chart.squares[chart.squares.length - 1] : origin;
  if (chart.next.includes(square)) {
    const digit = stepDigit(last, square);
    return digit ? { type: 'chartStep', digit } : null;
  }
  if (chart.squares.length > 0 && square === last) return { type: 'chartBack' };
  return null;
}

function targetTap(ctx: TapContext, square: SquareName): ComposerAction | null {
  const piece = ctx.view.selectedPiece;
  const target = ctx.view.targets.find((t) => t.to === square);
  if (!piece || !target) return null;
  const quietKingStep =
    piece.kind === 'king' && target.via === 'base' && !target.capture && !ctx.composer.stepBefore;
  if (quietKingStep) return { type: 'stepBefore', to: square };
  return { type: 'stageMain', main: { kind: 'move', from: piece.at, to: square } };
}

/**
 * Off-turn, every tap just picks a piece to look at. On your turn: a finished
 * king turn ignores taps; with a piece move staged, a highlighted square is
 * the free step after it; otherwise a tap extends a chart, plays a target, or
 * picks a (different) piece.
 */
export function interpretTap(ctx: TapContext, square: SquareName): ComposerAction | null {
  const { composer, view } = ctx;
  if (!ctx.canMove) return selectAction(ctx, square);
  if (view.kingTurn) return null;
  if (composer.main) {
    if (view.stepTargets.includes(square)) return { type: 'stepAfter', to: square };
    return selectAction(ctx, square);
  }
  if (view.selectedPiece && !view.inspecting) {
    const action = chartTap(ctx, square) ?? targetTap(ctx, square);
    if (action) return action;
  }
  return selectAction(ctx, square);
}
