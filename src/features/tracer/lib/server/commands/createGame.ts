import { initialState, type RuleSet, type Side } from '../../../engine';
import type { StyleRef } from '../../../variants';
import type { Actor, Seat, TracerGame } from '../../types';

export interface NewGameInput {
  displayName: string;
  /** Already resolved — the service turns "random" into a side. */
  seat: Side;
  /** Already validated — the service checks the style and rules. */
  style: StyleRef;
  rules: RuleSet;
}

const EMPTY_SEAT: Seat = { uid: null, name: null, joinedAt: null };

/**
 * A fresh online game, waiting (`open`) for an opponent to take the other
 * seat. Playing both sides on one device never reaches the server.
 */
export function createGame(id: string, actor: Actor, input: NewGameInput, now: number): TracerGame {
  const seat: Seat = { uid: actor.uid, name: input.displayName, joinedAt: now };
  return {
    id,
    schemaVersion: 3,
    style: input.style,
    status: 'open',
    createdBy: { uid: actor.uid, name: input.displayName },
    seats: { w: input.seat === 'w' ? seat : EMPTY_SEAT, b: input.seat === 'b' ? seat : EMPTY_SEAT },
    state: initialState(input.rules),
    lastTurn: null,
    drawOffer: null,
    rematchOf: null,
    rematchGameId: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    turnStartedAt: null,
    finishedAt: null,
  };
}
