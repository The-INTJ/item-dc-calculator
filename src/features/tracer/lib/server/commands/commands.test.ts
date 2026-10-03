// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { TracerError } from '../../errors';
import {
  activeGame,
  ALICE,
  BOB,
  CAROL,
  finishedGame,
  GAME_ID,
  bothSeatsGame,
  OPENING_CHART,
  openGame,
  T0,
} from '../../fixtures/game';
import { createGame, joinGame, requestRematch, resignGame, submitTurn } from './index';

function codeOf(run: () => unknown): string | null {
  try {
    run();
    return null;
  } catch (error) {
    return error instanceof TracerError ? error.code : 'NOT_A_TRACER_ERROR';
  }
}

describe('createGame', () => {
  it('opens an online game with the creator in the chosen seat', () => {
    const game = createGame(GAME_ID, ALICE, { displayName: 'Alice', seat: 'b' }, T0);
    expect(game).toMatchObject({ status: 'open', schemaVersion: 2, startedAt: null });
    expect(game.seats.b).toEqual({ uid: ALICE.uid, name: 'Alice', joinedAt: T0 });
    expect(game.seats.w.uid).toBeNull();
  });
});

describe('joinGame', () => {
  it('fills the empty seat and starts the game', () => {
    const result = joinGame(openGame(), BOB, 'Bob', T0 + 5);
    expect(result.response).toEqual({ side: 'b' });
    expect(result.game).toMatchObject({ status: 'active', startedAt: T0 + 5, turnStartedAt: T0 + 5 });
    expect(result.game?.seats.b).toEqual({ uid: BOB.uid, name: 'Bob', joinedAt: T0 + 5 });
  });

  it('is a no-op for someone already seated', () => {
    expect(joinGame(openGame(), ALICE, 'Alice', T0)).toMatchObject({ response: { side: 'w' }, game: null });
  });

  it('refuses a full or finished game', () => {
    expect(codeOf(() => joinGame(activeGame(), CAROL, 'Carol', T0))).toBe('GAME_FULL');
    expect(codeOf(() => joinGame(finishedGame({ seats: openGame().seats }), CAROL, 'Carol', T0))).toBe(
      'GAME_NOT_ACTIVE',
    );
  });
});

describe('submitTurn', () => {
  it('applies a legal turn and writes the turn record', () => {
    const result = submitTurn(activeGame(), ALICE, OPENING_CHART, T0 + 9);
    expect(result.response).toEqual({ ply: 1, status: 'active', replayed: false });
    expect(result.game?.state.kingPatterns.w).toEqual({ wT3: 'J:0,2' });
    expect(result.game?.lastTurn).toMatchObject({ ply: 0, clientTurnId: OPENING_CHART.clientTurnId });
    expect(result.game?.turnStartedAt).toBe(T0 + 9);
    expect(result.turn).toMatchObject({ ply: 0, side: 'w', byUid: ALICE.uid, at: T0 + 9 });
  });

  it('acknowledges a retry of the last turn without writing', () => {
    const played = submitTurn(activeGame(), ALICE, OPENING_CHART, T0).game!;
    const retry = submitTurn(played, ALICE, OPENING_CHART, T0 + 1);
    expect(retry).toEqual({ response: { ply: 1, status: 'active', replayed: true }, game: null, turn: null, newGame: null });
  });

  it('checks player, status, turn order and ply in that order', () => {
    expect(codeOf(() => submitTurn(activeGame(), CAROL, OPENING_CHART, T0))).toBe('NOT_A_PLAYER');
    expect(codeOf(() => submitTurn(finishedGame(), ALICE, OPENING_CHART, T0))).toBe('GAME_NOT_ACTIVE');
    expect(codeOf(() => submitTurn(activeGame(), BOB, OPENING_CHART, T0))).toBe('NOT_YOUR_TURN');
    const stale = { ...OPENING_CHART, turn: { ...OPENING_CHART.turn, ply: 3 } };
    expect(codeOf(() => submitTurn(activeGame(), ALICE, stale, T0))).toBe('STALE_PLY');
  });

  it('reports the engine’s reason for an illegal turn', () => {
    const illegal = { ...OPENING_CHART, turn: { ...OPENING_CHART.turn, main: { kind: 'move' as const, from: 'd2', to: 'd5' } } };
    try {
      submitTurn(activeGame(), ALICE, illegal, T0);
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({ code: 'ILLEGAL_TURN', reason: 'UNREACHABLE' });
    }
  });

  it('clears a draw offer when the offer’s recipient moves instead', () => {
    const offered = activeGame({ drawOffer: { by: 'b', at: T0, ply: 0 } });
    expect(submitTurn(offered, ALICE, OPENING_CHART, T0).game?.drawOffer).toBeNull();
    const own = activeGame({ drawOffer: { by: 'w', at: T0, ply: 0 } });
    expect(submitTurn(own, ALICE, OPENING_CHART, T0).game?.drawOffer).toEqual(own.drawOffer);
  });

  it('lets one person who holds both seats move both sides', () => {
    const first = submitTurn(bothSeatsGame(), ALICE, OPENING_CHART, T0).game!;
    const reply = {
      clientTurnId: 'turn-0002-abc',
      turn: { ply: 1, main: { kind: 'move' as const, from: 'd7', to: 'd6' }, freeStep: null },
    };
    expect(submitTurn(first, ALICE, reply, T0).response.ply).toBe(2);
  });
});

describe('resignGame', () => {
  it('ends the game for the resigning side, even off-turn', () => {
    const result = resignGame(activeGame(), BOB, T0 + 3);
    expect(result.game).toMatchObject({ status: 'finished', finishedAt: T0 + 3 });
    expect(result.response.result).toMatchObject({ status: 'won', winner: 'w', reason: 'resignation' });
  });
});

describe('requestRematch', () => {
  it('creates one rematch with colours swapped, then keeps returning it', () => {
    const first = requestRematch(finishedGame(), BOB, 'NewGameId00000000000', T0 + 7);
    expect(first.newGame?.seats.w.uid).toBe(BOB.uid);
    expect(first.newGame?.seats.b.uid).toBe(ALICE.uid);
    expect(first.newGame).toMatchObject({ status: 'active', rematchOf: GAME_ID, createdBy: { name: 'Bob' } });
    expect(first.game?.rematchGameId).toBe('NewGameId00000000000');
    const again = requestRematch(first.game!, ALICE, 'OtherId0000000000000', T0 + 8);
    expect(again).toMatchObject({ response: { gameId: 'NewGameId00000000000' }, newGame: null, game: null });
  });

  it('waits for the game to finish', () => {
    expect(codeOf(() => requestRematch(activeGame(), ALICE, 'x', T0))).toBe('GAME_NOT_FINISHED');
  });
});
