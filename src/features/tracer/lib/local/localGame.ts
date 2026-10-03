/**
 * Local games: one person playing both sides on one device. Nothing here
 * talks to a server — the engine runs in the browser and the game lives in
 * localStorage (see localStore.ts). Pure, so it is easy to test.
 */

import {
  agreeDraw,
  applyTurn,
  initialState,
  replayTurns,
  resign,
  sideToMove,
  type EngineErrorCode,
  type GameState,
  type TurnInput,
  type TurnRecord,
} from '../../engine';
import type { TracerGame } from '../types';

/** The identity both seats of a local game belong to. */
export const LOCAL_UID = 'local-player';

export const LOCAL_GAME_ID = /^local-[a-z0-9]{10}$/;

export interface LocalGameRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  state: GameState;
  /** Every turn played, in order — the move list, and the basis for undo. */
  turns: TurnRecord[];
}

export type LocalPlay =
  | { ok: true; record: LocalGameRecord }
  | { ok: false; code: EngineErrorCode; message: string };

export function newLocalGame(id: string, now: number): LocalGameRecord {
  return { id, createdAt: now, updatedAt: now, state: initialState(), turns: [] };
}

export function playLocalTurn(record: LocalGameRecord, turn: TurnInput, now: number): LocalPlay {
  const outcome = applyTurn(record.state, sideToMove(record.state), turn);
  if (!outcome.ok) return { ok: false, code: outcome.code, message: outcome.message };
  return {
    ok: true,
    record: { ...record, state: outcome.state, turns: [...record.turns, outcome.record], updatedAt: now },
  };
}

/**
 * Take back the last thing that happened: a resignation or agreed draw if
 * that is how the game ended, otherwise the last turn.
 */
export function undoLocalTurn(record: LocalGameRecord, now: number): LocalGameRecord {
  const result = record.state.result;
  const endedOffBoard = result.status !== 'active' && (result.reason === 'resignation' || result.reason === 'agreement');
  const turns = endedOffBoard ? record.turns : record.turns.slice(0, -1);
  if (!endedOffBoard && record.turns.length === 0) return record;
  const state = replayTurns(turns);
  return state ? { ...record, state, turns, updatedAt: now } : record;
}

export function endLocalGame(record: LocalGameRecord, how: 'resign' | 'draw', now: number): LocalGameRecord {
  const state = how === 'draw' ? agreeDraw(record.state) : resign(record.state, sideToMove(record.state));
  return state === record.state ? record : { ...record, state, updatedAt: now };
}

/** A local game shaped like an online one, so the shared board and panels can show it. */
export function localAsTracerGame(record: LocalGameRecord): TracerGame {
  const seat = (name: string) => ({ uid: LOCAL_UID, name, joinedAt: record.createdAt });
  const last = record.turns[record.turns.length - 1];
  const finished = record.state.result.status !== 'active';
  return {
    id: record.id,
    schemaVersion: 2,
    status: finished ? 'finished' : 'active',
    createdBy: { uid: LOCAL_UID, name: 'You' },
    seats: { w: seat('White'), b: seat('Black') },
    state: record.state,
    lastTurn: last ? { ...last, at: record.updatedAt, clientTurnId: `local-${last.ply}` } : null,
    drawOffer: null,
    rematchOf: null,
    rematchGameId: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    startedAt: record.createdAt,
    turnStartedAt: record.updatedAt,
    finishedAt: finished ? record.updatedAt : null,
  };
}
