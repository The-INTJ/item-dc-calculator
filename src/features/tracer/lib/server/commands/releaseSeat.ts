import type { Side } from '../../../engine';
import { TracerError } from '../../errors';
import { canReleaseSeat } from '../../policy';
import type { Actor, TracerGame } from '../../types';
import { updated } from './game-lifecycle';
import type { CommandResult } from './types';

/**
 * Reopen a stalled opponent's seat. Guests are tied to one browser's storage,
 * so a friend who switches phones (or opens the link inside another app)
 * would otherwise be locked out of their own game. The seat keeps their name
 * so the board can say "was Sam" until someone sits down.
 */
export function releaseSeat(
  game: TracerGame,
  actor: Actor,
  side: Side,
  now: number,
): CommandResult<{ side: Side }> {
  if (!canReleaseSeat(game, actor.uid, side, now)) {
    throw new TracerError('SEAT_NOT_RELEASABLE', 'That seat cannot be reopened yet.');
  }
  const seat = { uid: null, name: game.seats[side].name, joinedAt: null };
  return updated(
    { side },
    { ...game, seats: { ...game.seats, [side]: seat }, drawOffer: null, updatedAt: now },
  );
}
