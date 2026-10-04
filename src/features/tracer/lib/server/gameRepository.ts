/**
 * Server-only Firestore access for Tracer games.
 *
 * Every change is a pure command run inside a transaction: read the game,
 * let the command validate and describe its writes, apply them atomically.
 * A transaction may retry its callback under contention; commands are pure,
 * so a retry simply re-decides against the fresh document.
 *
 * Browsers never write here — Firestore rules deny it — but anyone holding a
 * game's unguessable id may read it live (see firestore.rules).
 */

import 'server-only';

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import { TracerError } from '../errors';
import { fromGameDoc, isNewerGameDoc, toGameDoc, turnDocId } from '../storage/gameDocument';
import type { TracerGame } from '../types';
import type { CommandResult } from './commands';

export const GAMES_COLLECTION = 'tracerGames';
export const TURNS_COLLECTION = 'turns';

function database() {
  const db = getFirebaseAdminFirestore();
  if (!db) throw new TracerError('STORAGE_UNAVAILABLE', 'Game storage is not configured.');
  return db;
}

function parsedOrThrow(id: string, data: unknown): TracerGame {
  if (isNewerGameDoc(data)) {
    throw new TracerError('GAME_OUTDATED', 'This game was saved by a newer version of Tracer.');
  }
  const game = fromGameDoc(id, data);
  if (!game) throw new TracerError('CORRUPT_GAME', 'This game could not be read.');
  return game;
}

/** A fresh, unguessable 20-character id. */
export function newGameId(): string {
  return database().collection(GAMES_COLLECTION).doc().id;
}

export async function insertGame(game: TracerGame): Promise<void> {
  await database().collection(GAMES_COLLECTION).doc(game.id).create(toGameDoc(game));
}

export async function loadGame(gameId: string): Promise<TracerGame | null> {
  const snapshot = await database().collection(GAMES_COLLECTION).doc(gameId).get();
  return snapshot.exists ? parsedOrThrow(snapshot.id, snapshot.data()) : null;
}

export async function runGameCommand<R>(
  gameId: string,
  command: (game: TracerGame) => CommandResult<R>,
): Promise<R> {
  const db = database();
  const games = db.collection(GAMES_COLLECTION);
  return db.runTransaction(async (tx) => {
    const ref = games.doc(gameId);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new TracerError('GAME_NOT_FOUND', 'That game does not exist.');
    const result = command(parsedOrThrow(snapshot.id, snapshot.data()));
    if (result.game) tx.set(ref, toGameDoc(result.game));
    if (result.turn) {
      tx.create(ref.collection(TURNS_COLLECTION).doc(turnDocId(result.turn.ply)), result.turn);
    }
    if (result.newGame) tx.create(games.doc(result.newGame.id), toGameDoc(result.newGame));
    return result.response;
  });
}
