/**
 * The authoritative turn. Checks run in a fixed order so every client sees
 * the same answer for the same situation:
 *
 *   player? → retry of the last turn? → game active? → caller's move? →
 *   built against the current ply? → legal (engine)?
 */

import { applyTurn, sideToMove } from '../../../engine';
import { TracerError } from '../../errors';
import type { SubmitTurnInput } from '../../schemas';
import type { Actor, GameStatus, StoredTurn, TracerGame } from '../../types';
import { requireActive, requirePlayer, unchanged, withState } from './game-lifecycle';
import type { CommandResult } from './types';

export interface TurnResponse {
  ply: number;
  status: GameStatus;
  replayed: boolean;
}

export function submitTurn(
  game: TracerGame,
  actor: Actor,
  input: SubmitTurnInput,
  now: number,
): CommandResult<TurnResponse> {
  const sides = requirePlayer(game, actor);
  if (game.lastTurn?.clientTurnId === input.clientTurnId) {
    return unchanged({ ply: game.state.ply, status: game.status, replayed: true });
  }
  requireActive(game);
  const side = sideToMove(game.state);
  if (!sides.includes(side)) throw new TracerError('NOT_YOUR_TURN', 'It is not your turn.');
  if (input.turn.ply !== game.state.ply) {
    throw new TracerError('STALE_PLY', 'The board changed since you started this turn.');
  }

  const outcome = applyTurn(game.state, side, input.turn);
  if (!outcome.ok) throw new TracerError('ILLEGAL_TURN', outcome.message, outcome.code);

  const turn: StoredTurn = { ...outcome.record, at: now, byUid: actor.uid, clientTurnId: input.clientTurnId };
  const offerStands = game.drawOffer !== null && game.drawOffer.by === side;
  const next = withState(
    {
      ...game,
      lastTurn: { ...outcome.record, at: now, clientTurnId: input.clientTurnId },
      drawOffer: offerStands ? game.drawOffer : null,
      turnStartedAt: now,
    },
    outcome.state,
    now,
  );
  return {
    response: { ply: next.state.ply, status: next.status, replayed: false },
    game: next,
    turn,
    newGame: null,
  };
}
