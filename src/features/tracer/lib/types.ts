/**
 * Tracer game records: one game document per match, plus one immutable turn
 * document per turn played. Timestamps are server `Date.now()` milliseconds.
 */

import type { GameState, Side, TurnRecord } from '../engine';

export type GameStatus = 'open' | 'active' | 'finished';

export interface Seat {
  uid: string | null;
  /** Kept when a seat is reopened, so the board can say "was Sam". */
  name: string | null;
  joinedAt: number | null;
}

export interface DrawOffer {
  by: Side;
  at: number;
  ply: number;
}

/** The most recent turn, kept on the game so a reload can redraw it. */
export interface LastTurn extends TurnRecord {
  at: number;
  /** Lets a retried submission be recognised and acknowledged safely. */
  clientTurnId: string;
}

export interface TracerGame {
  id: string;
  /** 2 = tiered Tracers lending their current patterns. v1 games are not readable. */
  schemaVersion: 2;
  status: GameStatus;
  createdBy: { uid: string; name: string };
  seats: Record<Side, Seat>;
  state: GameState;
  lastTurn: LastTurn | null;
  drawOffer: DrawOffer | null;
  rematchOf: string | null;
  rematchGameId: string | null;
  createdAt: number;
  updatedAt: number;
  startedAt: number | null;
  turnStartedAt: number | null;
  finishedAt: number | null;
}

/** `tracerGames/{id}/turns/{ply}` — written once, never changed. */
export interface StoredTurn extends TurnRecord {
  at: number;
  byUid: string;
  clientTurnId: string;
}

/** The verified caller of a server command. */
export interface Actor {
  uid: string;
}
