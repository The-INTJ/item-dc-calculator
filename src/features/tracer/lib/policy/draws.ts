/**
 * Draw offers. An offer stands until the opponent accepts or declines it,
 * the offerer withdraws it, or the opponent makes a move (see submitTurn).
 *
 * The acting side is worked out from the seats held, so the same rules serve
 * online play (one seat) and one person holding both seats.
 */

import { otherSide, sideToMove, type Side } from '../../engine';
import { TracerError } from '../errors';
import type { DrawAction } from '../schemas';
import type { DrawOffer, TracerGame } from '../types';

export interface DrawChange {
  drawOffer: DrawOffer | null;
  agreed: boolean;
  changed: boolean;
}

function offer(game: TracerGame, sides: Side[], now: number): DrawChange {
  const existing = game.drawOffer;
  if (existing && sides.includes(existing.by)) {
    return { drawOffer: existing, agreed: false, changed: false };
  }
  if (existing) {
    throw new TracerError('DRAW_OFFER_PENDING', 'Your opponent already offered a draw.');
  }
  const toMove = sideToMove(game.state);
  const by = sides.includes(toMove) ? toMove : sides[0];
  return { drawOffer: { by, at: now, ply: game.state.ply }, agreed: false, changed: true };
}

function answer(game: TracerGame, sides: Side[], accept: boolean): DrawChange {
  const existing = game.drawOffer;
  if (!existing || !sides.includes(otherSide(existing.by))) {
    throw new TracerError('NO_DRAW_OFFER', 'There is no draw offer to answer.');
  }
  return { drawOffer: null, agreed: accept, changed: true };
}

function withdraw(game: TracerGame, sides: Side[]): DrawChange {
  const existing = game.drawOffer;
  if (!existing || !sides.includes(existing.by)) {
    throw new TracerError('NO_DRAW_OFFER', 'You have no draw offer to withdraw.');
  }
  return { drawOffer: null, agreed: false, changed: true };
}

export function resolveDraw(
  game: TracerGame,
  sides: Side[],
  action: DrawAction,
  now: number,
): DrawChange {
  if (game.status !== 'active') {
    throw new TracerError('GAME_NOT_ACTIVE', 'Draws can only be agreed during a game.');
  }
  switch (action) {
    case 'offer':
      return offer(game, sides, now);
    case 'accept':
      return answer(game, sides, true);
    case 'decline':
      return answer(game, sides, false);
    case 'withdraw':
      return withdraw(game, sides);
  }
}
