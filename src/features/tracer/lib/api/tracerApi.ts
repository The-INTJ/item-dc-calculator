/**
 * Browser client for the Tracer API. Every call resolves — never throws —
 * to `{ ok: true, data }` or `{ ok: false, code, message, reason }`, so UI
 * code can branch on stable codes instead of parsing error strings.
 */

import { fetchWithAuth } from '@/contest/lib/api/fetchWithAuth';

import type { GameResult, Side } from '../../engine';
import type { CreateGameInput, DrawAction, SubmitTurnInput } from '../schemas';
import type { DrawResponse, TurnResponse } from '../server/commands';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; reason: string | null };

interface ErrorBody {
  code?: string;
  message?: string;
  reason?: string;
}

async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) });
  } catch {
    return { ok: false, code: 'NETWORK', message: 'Could not reach the server.', reason: null };
  }
  const payload = (await response.json().catch(() => null)) as (T & ErrorBody) | null;
  if (response.ok) return { ok: true, data: payload as T };
  if (response.status === 401) {
    return { ok: false, code: 'UNAUTHENTICATED', message: 'Please sign in again.', reason: null };
  }
  return {
    ok: false,
    code: payload?.code ?? 'REQUEST_FAILED',
    message: payload?.message ?? 'Something went wrong.',
    reason: payload?.reason ?? null,
  };
}

const gamePath = (gameId: string, action: string) =>
  `/api/tracer/games/${encodeURIComponent(gameId)}/${action}`;

export const tracerApi = {
  createGame: (input: CreateGameInput) => post<{ gameId: string }>('/api/tracer/games', input),
  join: (gameId: string, displayName: string) =>
    post<{ side: Side }>(gamePath(gameId, 'join'), { displayName }),
  submitTurn: (gameId: string, input: SubmitTurnInput) =>
    post<TurnResponse>(gamePath(gameId, 'turns'), input),
  resign: (gameId: string) => post<{ result: GameResult }>(gamePath(gameId, 'resign'), {}),
  draw: (gameId: string, action: DrawAction) =>
    post<DrawResponse>(gamePath(gameId, 'draw'), { action }),
  rematch: (gameId: string) => post<{ gameId: string }>(gamePath(gameId, 'rematch'), {}),
  releaseSeat: (gameId: string, side: Side) =>
    post<{ side: Side }>(gamePath(gameId, 'seats/release'), { side }),
};

const FRIENDLY: Record<string, string> = {
  NETWORK: 'Connection lost — check your signal and try again.',
  UNAUTHENTICATED: 'Your session expired. Reload the page to sign back in.',
  STALE_PLY: 'The board changed before your turn arrived — have another look.',
  NOT_YOUR_TURN: 'It is not your move yet.',
  GAME_FULL: 'Both seats were just taken.',
  GAME_NOT_ACTIVE: 'This game is no longer in progress.',
  NOT_A_PLAYER: 'You are watching this game, not playing in it.',
  STORAGE_UNAVAILABLE: 'The game server is not available right now.',
};

/** Player-facing copy for a failed call. Rule rejections keep the engine's words. */
export function errorCopy(error: { code: string; message: string }): string {
  return FRIENDLY[error.code] ?? error.message;
}
