/**
 * Small rules every command shares: who counts as a player, and how a game
 * moves to `finished` when its state reaches a result.
 */

import type { GameState, Side } from '../../../engine';
import { TracerError } from '../../errors';
import { seatsHeldBy } from '../../policy';
import type { Actor, TracerGame } from '../../types';
import type { CommandResult } from './types';

export function requirePlayer(game: TracerGame, actor: Actor): Side[] {
  const sides = seatsHeldBy(game, actor.uid);
  if (sides.length === 0) {
    throw new TracerError('NOT_A_PLAYER', 'You are not playing in this game.');
  }
  return sides;
}

export function requireActive(game: TracerGame): void {
  if (game.status !== 'active') {
    throw new TracerError('GAME_NOT_ACTIVE', 'This game is not in progress.');
  }
}

/** Put a new engine state on the game, finishing it if the state is decided. */
export function withState(game: TracerGame, state: GameState, now: number): TracerGame {
  const over = state.result.status !== 'active';
  return {
    ...game,
    state,
    status: over ? 'finished' : game.status,
    drawOffer: over ? null : game.drawOffer,
    finishedAt: over ? now : game.finishedAt,
    updatedAt: now,
  };
}

export function unchanged<R>(response: R): CommandResult<R> {
  return { response, game: null, turn: null, newGame: null };
}

export function updated<R>(response: R, game: TracerGame): CommandResult<R> {
  return { response, game, turn: null, newGame: null };
}
