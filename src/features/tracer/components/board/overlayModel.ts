/**
 * The lines drawn over the board: the path being charted, the staged turn,
 * the last turn played, and faint rays showing a selected rider's reach.
 * (Threat lines come from threatOverlay.ts.)
 */

import { pathSquares, patternKind, type ActionRecord, type Side, type SquareName, type TurnRecord } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import { centerOf } from './boardGeometry';

export type LineKind = 'rider' | 'jumper' | 'step' | 'last' | 'ghost' | 'threat' | 'threatStep' | 'routeRider' | 'routeJumper';

export interface OverlayLine {
  key: string;
  points: string;
  kind: LineKind;
  arrow: boolean;
}

/** SVG polyline points through the centres of `squares`. */
export function points(squares: SquareName[], orientation: Side): string {
  return squares
    .map((square) => centerOf(square, orientation))
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');
}

function actionLine(action: ActionRecord, orientation: Side, key: string, faded: boolean): OverlayLine | null {
  if (action.kind === 'pass' || action.kind === 'declare') return null;
  let squares: SquareName[];
  let kind: LineKind;
  // A chart's Tracer may stop short of its path's end (or stay put): then the
  // path is drawn as traced, without an arrowhead claiming it went all the way.
  let arrow = true;
  if (action.kind === 'step') {
    squares = [action.from, action.to];
    kind = 'step';
  } else if (action.kind === 'chart') {
    squares = [action.from, ...pathSquares(action.from, action.steps)];
    kind = patternKind(action.pattern) === 'jumper' ? 'jumper' : 'rider';
    arrow = squares[squares.length - 1] === action.to;
  } else {
    squares = action.path ? [action.from, ...pathSquares(action.from, action.path)] : [action.from, action.to];
    kind = action.path ? 'rider' : action.via === 'base' ? 'step' : 'jumper';
  }
  return { key, points: points(squares, orientation), kind: faded ? 'last' : kind, arrow };
}

export function overlayLines(
  view: ComposerView,
  chartOrigin: SquareName | null,
  lastTurn: TurnRecord | null,
  orientation: Side,
): OverlayLine[] {
  const lines: OverlayLine[] = [];
  const push = (line: OverlayLine | null) => line && lines.push(line);
  const at = view.selectedPiece?.at;
  view.walks.forEach((walk, index) => {
    const squares = at ? pathSquares(at, walk.path.slice(0, walk.reached)) : [];
    if (at && squares.length > 0) {
      lines.push({ key: `ray-${index}`, points: points([at, ...squares], orientation), kind: 'ghost', arrow: false });
    }
  });
  const staged = view.outcome?.ok ? view.outcome.record.actions : null;
  (staged ?? lastTurn?.actions ?? []).forEach((action, index) =>
    push(actionLine(action, orientation, `turn-${index}`, staged === null)),
  );
  if (view.chart && chartOrigin && view.chart.squares.length > 0) {
    const kind: LineKind = view.chart.kind ?? (view.chart.touchesPiece ? 'jumper' : 'rider');
    lines.push({ key: 'chart', points: points([chartOrigin, ...view.chart.squares], orientation), kind, arrow: true });
  }
  return lines;
}
