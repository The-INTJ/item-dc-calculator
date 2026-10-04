/**
 * The threats view: every square the opponent could capture on next turn —
 * including their own pieces they would recapture — the viewer's pieces that
 * are defended, and lines from the pieces behind a threat. Lines are drawn
 * into each of the viewer's threatened pieces, and into whichever square the
 * viewer is probing (hovered, focused or tapped).
 */

import { controlMap, defenders, otherSide, pathSquares, type GameState, type Side, type SquareName, type Threat } from '../../engine';
import { points, type OverlayLine } from './overlayModel';

export interface ThreatView {
  /** Squares the opponent controls. */
  squares: SquareName[];
  /** The viewer's pieces that the viewer could recapture on. */
  guarded: SquareName[];
  lines: OverlayLine[];
}

export const NO_THREATS: ThreatView = { squares: [], guarded: [], lines: [] };

function threatLine(threat: Threat, target: SquareName, orientation: Side, key: string): OverlayLine {
  const squares = threat.path ? [threat.from, ...pathSquares(threat.from, threat.path)] : [threat.from, target];
  return { key, points: points(squares, orientation), kind: threat.afterStep ? 'threatStep' : 'threat', arrow: true };
}

/** The threats view for the player at the bottom of the board (`orientation`). */
export function threatView(board: GameState, orientation: Side, probe: SquareName | null): ThreatView {
  const control = controlMap(board, otherSide(orientation));
  const targets = new Set(board.pieces.filter((p) => p.side === orientation && control.has(p.at)).map((p) => p.at));
  if (probe && control.has(probe)) targets.add(probe);
  const lines = [...targets].flatMap((target) =>
    (control.get(target) ?? []).map((threat) => threatLine(threat, target, orientation, `threat-${target}-${threat.pieceId}`)),
  );
  return { squares: [...control.keys()], guarded: [...defenders(board, orientation).keys()], lines };
}
