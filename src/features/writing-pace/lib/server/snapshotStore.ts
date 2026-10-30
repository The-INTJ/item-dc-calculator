/**
 * Server-only history of daily word counts, for the rolling week.
 *
 * One Firestore document per snapshot date, written through the Admin SDK
 * (reused from the contest feature); the collection falls under the rules'
 * deny-all, so the client never reads it directly.
 */

import 'server-only';

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import type { WordSnapshot } from '../pace';

const COLLECTION = 'writingPaceSnapshots';
/** gRPC ALREADY_EXISTS: `create` found that day's document. */
const ALREADY_EXISTS = 6;

/**
 * Keeps the first count of each snapshot date, the one nearest 6am, so a
 * later refresh never moves the start of next week's window.
 */
export async function recordSnapshot({ date, words }: WordSnapshot) {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return;
  }
  try {
    await db.collection(COLLECTION).doc(date).create({ date, words });
  } catch (error) {
    if ((error as { code?: number }).code !== ALREADY_EXISTS) {
      throw error;
    }
  }
}

/** The oldest count stored on or after `from` and before `before`. */
export async function oldestSnapshotBetween(from: string, before: string): Promise<WordSnapshot | null> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return null;
  }
  const result = await db
    .collection(COLLECTION)
    .where('date', '>=', from)
    .where('date', '<', before)
    .orderBy('date')
    .limit(1)
    .get();
  const doc = result.docs[0];
  return doc ? (doc.data() as WordSnapshot) : null;
}
