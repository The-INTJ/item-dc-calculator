import { resign, sideToMove, type GameResult } from '../../../engine';
import type { Actor, TracerGame } from '../../types';
import { requireActive, requirePlayer, updated, withState } from './game-lifecycle';
import type { CommandResult } from './types';

/**
 * Resign at any time, even on the opponent's move. When one person holds
 * both seats (hotseat), the side to move is the one that resigns.
 */
export function resignGame(
  game: TracerGame,
  actor: Actor,
  now: number,
): CommandResult<{ result: GameResult }> {
  const sides = requirePlayer(game, actor);
  requireActive(game);
  const toMove = sideToMove(game.state);
  const side = sides.includes(toMove) ? toMove : sides[0];
  const next = withState(game, resign(game.state, side), now);
  return updated({ result: next.state.result }, next);
}
