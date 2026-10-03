/**
 * Test support: game records in common situations.
 */

import { initialState } from '../../engine';
import type { Seat, TracerGame } from '../types';

export const ALICE = { uid: 'alice-uid' };
export const BOB = { uid: 'bob-uid' };
export const CAROL = { uid: 'carol-uid' };
export const GAME_ID = 'AbCdEfGhIjKlMnOpQrSt';
export const T0 = 1_700_000_000_000;

function seat(uid: string | null, name: string | null): Seat {
  return { uid, name, joinedAt: uid ? T0 : null };
}

/** An online game: Alice is White, Bob is Black, the game is under way. */
export function activeGame(overrides: Partial<TracerGame> = {}): TracerGame {
  return {
    id: GAME_ID,
    schemaVersion: 1,
    status: 'active',
    mode: 'online',
    createdBy: { uid: ALICE.uid, name: 'Alice' },
    seats: { w: seat(ALICE.uid, 'Alice'), b: seat(BOB.uid, 'Bob') },
    state: initialState(),
    lastTurn: null,
    drawOffer: null,
    rematchOf: null,
    rematchGameId: null,
    createdAt: T0,
    updatedAt: T0,
    startedAt: T0,
    turnStartedAt: T0,
    finishedAt: null,
    ...overrides,
  };
}

/** Alice is waiting as White for someone to take Black. */
export function openGame(overrides: Partial<TracerGame> = {}): TracerGame {
  return activeGame({
    status: 'open',
    seats: { w: seat(ALICE.uid, 'Alice'), b: seat(null, null) },
    startedAt: null,
    turnStartedAt: null,
    ...overrides,
  });
}

/** Alice plays both sides on one device. */
export function hotseatGame(overrides: Partial<TracerGame> = {}): TracerGame {
  return activeGame({
    mode: 'hotseat',
    seats: { w: seat(ALICE.uid, 'Alice'), b: seat(ALICE.uid, 'Alice') },
    ...overrides,
  });
}

/** A finished game White won by resignation. */
export function finishedGame(overrides: Partial<TracerGame> = {}): TracerGame {
  const state = { ...initialState(), result: { status: 'won', winner: 'w', reason: 'resignation', atPly: 0 } as const };
  return activeGame({ status: 'finished', state, finishedAt: T0 + 1, ...overrides });
}

/** White's opening chart, b1 over both wardens to a8. */
export const OPENING_CHART = {
  clientTurnId: 'turn-0001-abc',
  turn: { ply: 0, main: { kind: 'chart' as const, from: 'b1', steps: '8888887' }, freeStep: null },
};
