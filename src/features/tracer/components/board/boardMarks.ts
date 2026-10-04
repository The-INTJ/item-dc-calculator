/**
 * Per-square decorations for the board, derived from the turn being built,
 * the last turn played, and (optionally) the opponent's controlled squares.
 */

import type { ActionRecord, MoveTarget, SquareName, TurnRecord } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';

export interface SquareMarks {
  /** A square the piece in hand can move to. */
  target: 'move' | 'capture' | null;
  /** Reach of a piece that is only being looked at. */
  reach: 'move' | 'capture' | null;
  /** 1-based position along the chart being drawn. */
  chartIndex: number | null;
  chartNext: boolean;
  step: boolean;
  selected: boolean;
  lastMove: boolean;
  /** The opponent could capture here next turn. */
  threatened: boolean;
  /** One of the viewer's pieces that the viewer could recapture on. */
  guarded: boolean;
}

const BLANK: SquareMarks = {
  target: null,
  reach: null,
  chartIndex: null,
  chartNext: false,
  step: false,
  selected: false,
  lastMove: false,
  threatened: false,
  guarded: false,
};

function touchedSquares(action: ActionRecord): SquareName[] {
  return action.kind === 'pass' ? [] : [action.from, action.to];
}

export function boardMarks(
  view: ComposerView,
  lastTurn: TurnRecord | null,
  threats: { squares: readonly SquareName[]; guarded: readonly SquareName[] },
): Map<SquareName, SquareMarks> {
  const marks = new Map<SquareName, SquareMarks>();
  const mark = (square: SquareName, patch: Partial<SquareMarks>) =>
    marks.set(square, { ...(marks.get(square) ?? BLANK), ...patch });
  const kindOf = (target: MoveTarget) => (target.capture ? 'capture' : 'move');

  lastTurn?.actions.flatMap(touchedSquares).forEach((square) => mark(square, { lastMove: true }));
  threats.squares.forEach((square) => mark(square, { threatened: true }));
  threats.guarded.forEach((square) => mark(square, { guarded: true }));
  if (view.selectedPiece) mark(view.selectedPiece.at, { selected: true });
  for (const target of view.targets) {
    mark(target.to, view.inspecting ? { reach: kindOf(target) } : { target: kindOf(target) });
  }
  view.chart?.squares.forEach((square, index) => mark(square, { chartIndex: index + 1 }));
  view.chart?.next.forEach((square) => mark(square, { chartNext: true }));
  view.stepTargets.forEach((square) => mark(square, { step: true }));
  return marks;
}

export function marksFor(marks: Map<SquareName, SquareMarks>, square: SquareName): SquareMarks {
  return marks.get(square) ?? BLANK;
}
