import type { Side } from '../../../engine';
import { TracerError } from '../../errors';
import { emptySeat, seatsHeldBy } from '../../policy';
import type { Actor, TracerGame } from '../../types';
import { unchanged, updated } from './game-lifecycle';
import type { CommandResult } from './types';

/**
 * Take the empty seat. Joining a game you already sit in is a no-op, so a
 * double-tap or a reload can never cost anyone their seat.
 */
export function joinGame(
  game: TracerGame,
  actor: Actor,
  displayName: string,
  now: number,
): CommandResult<{ side: Side }> {
  const held = seatsHeldBy(game, actor.uid);
  if (held.length > 0) return unchanged({ side: held[0] });
  if (game.status === 'finished') {
    throw new TracerError('GAME_NOT_ACTIVE', 'This game has already finished.');
  }
  const side = emptySeat(game);
  if (!side) throw new TracerError('GAME_FULL', 'Both seats are taken.');
  return updated(
    { side },
    {
      ...game,
      seats: { ...game.seats, [side]: { uid: actor.uid, name: displayName, joinedAt: now } },
      status: 'active',
      startedAt: game.startedAt ?? now,
      turnStartedAt: game.turnStartedAt ?? now,
      updatedAt: now,
    },
  );
}
