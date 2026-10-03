/**
 * The public server entry points: route handlers call these. This is the
 * only layer that reads the clock, rolls dice, or mints ids — commands stay
 * pure and testable.
 */

import 'server-only';

import type { Side } from '../../engine';
import type { CreateGameInput, DrawAction, SubmitTurnInput } from '../schemas';
import type { Actor } from '../types';
import {
  createGame,
  joinGame,
  negotiateDraw,
  releaseSeat,
  requestRematch,
  resignGame,
  submitTurn,
} from './commands';
import { insertGame, newGameId, runGameCommand } from './gameRepository';

export async function createNewGame(actor: Actor, input: CreateGameInput) {
  const seat: Side = input.seat === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : input.seat;
  const game = createGame(
    newGameId(),
    actor,
    { displayName: input.displayName, seat, mode: input.mode },
    Date.now(),
  );
  await insertGame(game);
  return { gameId: game.id };
}

export function joinExistingGame(gameId: string, actor: Actor, displayName: string) {
  return runGameCommand(gameId, (game) => joinGame(game, actor, displayName, Date.now()));
}

export function playTurn(gameId: string, actor: Actor, input: SubmitTurnInput) {
  return runGameCommand(gameId, (game) => submitTurn(game, actor, input, Date.now()));
}

export function resignFromGame(gameId: string, actor: Actor) {
  return runGameCommand(gameId, (game) => resignGame(game, actor, Date.now()));
}

export function answerDraw(gameId: string, actor: Actor, action: DrawAction) {
  return runGameCommand(gameId, (game) => negotiateDraw(game, actor, action, Date.now()));
}

export function startRematch(gameId: string, actor: Actor) {
  const newId = newGameId();
  return runGameCommand(gameId, (game) => requestRematch(game, actor, newId, Date.now()));
}

export function reopenSeat(gameId: string, actor: Actor, side: Side) {
  return runGameCommand(gameId, (game) => releaseSeat(game, actor, side, Date.now()));
}
