import { initialState } from '../../../engine';
import { TracerError } from '../../errors';
import type { Actor, Seat, TracerGame } from '../../types';
import { requirePlayer, unchanged } from './game-lifecycle';
import type { CommandResult } from './types';

function freshSeat(seat: Seat, now: number): Seat {
  return seat.uid ? { uid: seat.uid, name: seat.name, joinedAt: now } : { uid: null, name: null, joinedAt: null };
}

/**
 * A rematch swaps colours. Asking twice — or both players asking — returns
 * the same new game, so both land in it together.
 */
export function requestRematch(
  game: TracerGame,
  actor: Actor,
  newId: string,
  now: number,
): CommandResult<{ gameId: string }> {
  requirePlayer(game, actor);
  if (game.status !== 'finished') {
    throw new TracerError('GAME_NOT_FINISHED', 'Finish this game before starting a rematch.');
  }
  if (game.rematchGameId) return unchanged({ gameId: game.rematchGameId });

  const seats = { w: freshSeat(game.seats.b, now), b: freshSeat(game.seats.w, now) };
  const full = seats.w.uid !== null && seats.b.uid !== null;
  const requester = game.seats.w.uid === actor.uid ? game.seats.w : game.seats.b;
  const newGame: TracerGame = {
    id: newId,
    schemaVersion: 1,
    status: full ? 'active' : 'open',
    mode: game.mode,
    createdBy: { uid: actor.uid, name: requester.name ?? game.createdBy.name },
    seats,
    state: initialState(),
    lastTurn: null,
    drawOffer: null,
    rematchOf: game.id,
    rematchGameId: null,
    createdAt: now,
    updatedAt: now,
    startedAt: full ? now : null,
    turnStartedAt: full ? now : null,
    finishedAt: null,
  };
  return {
    response: { gameId: newId },
    game: { ...game, rematchGameId: newId, updatedAt: now },
    turn: null,
    newGame,
  };
}
