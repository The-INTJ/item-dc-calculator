/**
 * Server-only Firestore access for the donut board.
 *
 * The entire board is one document, so every write is a read-modify-write in a
 * transaction. Callers express a change as a pure function over the board and
 * throw to reject it; `mutateBoard` handles the plumbing and error envelope.
 *
 * The route handlers in front of this are deliberately unauthenticated, so all
 * traffic reaches Firestore through the Admin SDK here rather than the client
 * SDK — the `donuts` collection stays closed to direct browser access.
 */

import 'server-only';

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import { createDefaultBoard } from '../defaults';
import type { DonutBoard, ProviderResult } from '../types';

import { toBoard, toDoc, type BoardDoc } from './boardDocument';

const COLLECTION = 'donuts';
const DOCUMENT = 'board';

/** How many log entries to keep; older swaps drop off the bottom. */
const LOG_LIMIT = 200;

export function ok<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

export function fail<T = never>(error: string): ProviderResult<T> {
  return { success: false, error };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function boardRef() {
  const db = getFirebaseAdminFirestore();
  return db ? db.collection(COLLECTION).doc(DOCUMENT) : null;
}

/** Trim the log and stamp the write time. Applied to every mutation result. */
function finalize(board: DonutBoard): DonutBoard {
  return {
    ...board,
    log: [...board.log].sort((a, b) => b.at - a.at).slice(0, LOG_LIMIT),
    updatedAt: Date.now(),
  };
}

/** Read the board, creating the seeded default the first time it is asked for. */
export async function loadBoard(): Promise<ProviderResult<DonutBoard>> {
  const ref = boardRef();
  if (!ref) {
    return fail('Donut storage is not configured');
  }
  try {
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      const seeded = createDefaultBoard();
      await ref.set(toDoc(seeded));
      return ok(seeded);
    }
    return ok(toBoard(snapshot.data() as BoardDoc));
  } catch (error) {
    return fail(describeError(error));
  }
}

/**
 * Apply a change to the board inside a transaction. `mutate` receives the
 * current board and returns the next one; throwing rejects the write with the
 * thrown message as the error.
 */
export async function mutateBoard(
  mutate: (board: DonutBoard) => DonutBoard,
): Promise<ProviderResult<DonutBoard>> {
  const ref = boardRef();
  if (!ref) {
    return fail('Donut storage is not configured');
  }
  try {
    const next = await getFirebaseAdminFirestore()!.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const current = snapshot.exists
        ? toBoard(snapshot.data() as BoardDoc)
        : createDefaultBoard();
      const updated = finalize(mutate(current));
      tx.set(ref, toDoc(updated));
      return updated;
    });
    return ok(next);
  } catch (error) {
    return fail(describeError(error));
  }
}
