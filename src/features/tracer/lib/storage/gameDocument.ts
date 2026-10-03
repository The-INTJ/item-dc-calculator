/**
 * The boundary between Tracer's domain records and Firestore documents.
 *
 * The engine's data is already Firestore-safe (no nested arrays, `null` for
 * missing values), so storing a game is just dropping its `id`; reading one
 * is a full schema check. Both the Admin SDK (server) and the client SDK
 * (live snapshots) go through these functions.
 */

import { z } from 'zod';

import type { StoredTurn, TracerGame } from '../types';
import { GameStateSchema, SideSchema, TurnRecordShape } from './stateSchema';

const SeatSchema = z.object({
  uid: z.string().nullable(),
  name: z.string().nullable(),
  joinedAt: z.number().nullable(),
});

const LastTurnSchema = z.object({
  ...TurnRecordShape,
  at: z.number(),
  clientTurnId: z.string(),
});

const GameDocSchema = z.object({
  schemaVersion: z.literal(1),
  status: z.enum(['open', 'active', 'finished']),
  mode: z.enum(['online', 'hotseat']),
  createdBy: z.object({ uid: z.string(), name: z.string() }),
  seats: z.object({ w: SeatSchema, b: SeatSchema }),
  state: GameStateSchema,
  lastTurn: LastTurnSchema.nullable(),
  drawOffer: z.object({ by: SideSchema, at: z.number(), ply: z.number() }).nullable(),
  rematchOf: z.string().nullable(),
  rematchGameId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  startedAt: z.number().nullable(),
  turnStartedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
});

const TurnDocSchema = z.object({
  ...TurnRecordShape,
  at: z.number(),
  byUid: z.string(),
  clientTurnId: z.string(),
});

export type GameDoc = Omit<TracerGame, 'id'>;

export function toGameDoc(game: TracerGame): GameDoc {
  const { id: _id, ...doc } = game;
  return doc;
}

/** Parse a stored game. Returns null when the document is malformed. */
export function fromGameDoc(id: string, data: unknown): TracerGame | null {
  const parsed = GameDocSchema.safeParse(data);
  return parsed.success ? { id, ...parsed.data } : null;
}

export function fromTurnDoc(data: unknown): StoredTurn | null {
  const parsed = TurnDocSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Turn documents are keyed by zero-padded ply so they sort naturally. */
export function turnDocId(ply: number): string {
  return String(ply).padStart(4, '0');
}
