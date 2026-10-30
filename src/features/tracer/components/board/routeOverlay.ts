/**
 * Active routes, where patterns work only as traced: each formed Tracer's
 * route — and a king's declared one — drawn from where the piece stands, as
 * far as it can go right now. Both players see every route, so an attack is
 * always in plain sight.
 */

import { pathSquares, patternKind, patternTargets, tracedOnly, type GameState, type Side } from '../../engine';
import { points, type OverlayLine } from './overlayModel';

export function routeLines(board: GameState, orientation: Side): OverlayLine[] {
  if (!tracedOnly(board.rules)) return [];
  return board.pieces.flatMap((piece): OverlayLine[] => {
    if (!piece.pattern || piece.kind === 'warden') return [];
    const reach = patternTargets(board, piece.at, piece.side, piece.pattern);
    const key = `route-${piece.id}`;
    if (patternKind(piece.pattern) === 'jumper') {
      const landing = reach.targets[0];
      return landing ? [{ key, points: points([piece.at, landing.to], orientation), kind: 'routeJumper', arrow: true }] : [];
    }
    const walk = reach.walks[0];
    if (!walk || walk.reached === 0) return [];
    const squares = [piece.at, ...pathSquares(piece.at, walk.path.slice(0, walk.reached))];
    return [{ key, points: points(squares, orientation), kind: 'routeRider', arrow: true }];
  });
}
