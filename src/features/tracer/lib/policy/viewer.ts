/**
 * Who is looking at a game, and what they may do. Pure, so the browser and
 * tests share one definition.
 */

import { sideToMove, type Side } from '../../engine';
import type { TracerGame } from '../types';
import { emptySeat, seatsHeldBy } from './seats';

export type ViewerRole = 'spectator' | 'player' | 'both';

export interface Viewer {
  role: ViewerRole;
  /** Seats this viewer holds. */
  sides: Side[];
  /** The side this viewer acts for now — the side to move when playing both. */
  actingSide: Side | null;
  canMove: boolean;
  canJoin: boolean;
  /** The side drawn at the bottom of the board. */
  orientation: Side;
}

function roleFor(sides: Side[]): ViewerRole {
  if (sides.length === 2) return 'both';
  return sides.length === 1 ? 'player' : 'spectator';
}

export function deriveViewer(game: TracerGame, uid: string | null): Viewer {
  const sides = seatsHeldBy(game, uid);
  const toMove = sideToMove(game.state);
  const role = roleFor(sides);
  const actingSide = role === 'both' ? toMove : (sides[0] ?? null);
  return {
    role,
    sides,
    actingSide,
    canMove: game.status === 'active' && sides.includes(toMove),
    canJoin: sides.length === 0 && game.status !== 'finished' && emptySeat(game) !== null,
    orientation: actingSide ?? 'w',
  };
}
