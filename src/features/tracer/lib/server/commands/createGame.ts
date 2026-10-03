import { initialState, type Side } from '../../../engine';
import type { Actor, GameMode, Seat, TracerGame } from '../../types';

export interface NewGameInput {
  displayName: string;
  /** Already resolved — the service turns "random" into a side. */
  seat: Side;
  mode: GameMode;
}

const EMPTY_SEAT: Seat = { uid: null, name: null, joinedAt: null };

/**
 * A fresh game. Online games wait for an opponent (`open`); hotseat games
 * seat the creator on both sides and start straight away.
 */
export function createGame(id: string, actor: Actor, input: NewGameInput, now: number): TracerGame {
  const seat: Seat = { uid: actor.uid, name: input.displayName, joinedAt: now };
  const hotseat = input.mode === 'hotseat';
  const seats = hotseat
    ? { w: seat, b: { ...seat } }
    : { w: input.seat === 'w' ? seat : EMPTY_SEAT, b: input.seat === 'b' ? seat : EMPTY_SEAT };
  return {
    id,
    schemaVersion: 1,
    status: hotseat ? 'active' : 'open',
    mode: input.mode,
    createdBy: { uid: actor.uid, name: input.displayName },
    seats,
    state: initialState(),
    lastTurn: null,
    drawOffer: null,
    rematchOf: null,
    rematchGameId: null,
    createdAt: now,
    updatedAt: now,
    startedAt: hotseat ? now : null,
    turnStartedAt: hotseat ? now : null,
    finishedAt: null,
  };
}
