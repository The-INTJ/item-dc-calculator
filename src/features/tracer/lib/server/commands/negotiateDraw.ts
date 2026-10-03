import { agreeDraw, type GameResult } from '../../../engine';
import { resolveDraw } from '../../policy';
import type { DrawAction } from '../../schemas';
import type { Actor, DrawOffer, TracerGame } from '../../types';
import { requirePlayer, unchanged, updated, withState } from './game-lifecycle';
import type { CommandResult } from './types';

export interface DrawResponse {
  drawOffer: DrawOffer | null;
  result: GameResult;
}

export function negotiateDraw(
  game: TracerGame,
  actor: Actor,
  action: DrawAction,
  now: number,
): CommandResult<DrawResponse> {
  const sides = requirePlayer(game, actor);
  const change = resolveDraw(game, sides, action, now);
  if (!change.changed) {
    return unchanged({ drawOffer: game.drawOffer, result: game.state.result });
  }
  const offered = { ...game, drawOffer: change.drawOffer, updatedAt: now };
  const next = change.agreed ? withState(offered, agreeDraw(game.state), now) : offered;
  return updated({ drawOffer: next.drawOffer, result: next.state.result }, next);
}
