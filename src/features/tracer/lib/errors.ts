/**
 * Typed errors for Tracer's server commands. Every rejection carries a stable
 * code; the HTTP status for each code lives in exactly one table here, and
 * the browser maps codes back to friendly copy.
 */

export type TracerErrorCode =
  | 'GAME_NOT_FOUND'
  | 'GAME_OUTDATED'
  | 'CORRUPT_GAME'
  | 'STORAGE_UNAVAILABLE'
  | 'NOT_A_PLAYER'
  | 'GAME_FULL'
  | 'GAME_NOT_ACTIVE'
  | 'NOT_YOUR_TURN'
  | 'STALE_PLY'
  | 'ILLEGAL_TURN'
  | 'DRAW_OFFER_PENDING'
  | 'NO_DRAW_OFFER'
  | 'SEAT_NOT_RELEASABLE'
  | 'GAME_NOT_FINISHED';

export const TRACER_ERROR_STATUS: Record<TracerErrorCode, number> = {
  GAME_NOT_FOUND: 404,
  GAME_OUTDATED: 410,
  CORRUPT_GAME: 500,
  STORAGE_UNAVAILABLE: 503,
  NOT_A_PLAYER: 403,
  GAME_FULL: 409,
  GAME_NOT_ACTIVE: 409,
  NOT_YOUR_TURN: 409,
  STALE_PLY: 409,
  ILLEGAL_TURN: 422,
  DRAW_OFFER_PENDING: 409,
  NO_DRAW_OFFER: 409,
  SEAT_NOT_RELEASABLE: 409,
  GAME_NOT_FINISHED: 409,
};

export class TracerError extends Error {
  readonly code: TracerErrorCode;
  /** For ILLEGAL_TURN: the engine's own rejection code. */
  readonly reason: string | null;

  constructor(code: TracerErrorCode, message: string, reason: string | null = null) {
    super(message);
    this.name = 'TracerError';
    this.code = code;
    this.reason = reason;
  }
}

export function isTracerError(error: unknown): error is TracerError {
  return error instanceof TracerError;
}
