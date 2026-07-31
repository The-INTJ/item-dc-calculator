import { type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { docToScoreEntry } from '../scoreHelpers';
import type { FirestoreAdapter } from '../firestoreAdapter';

export type ScoreQueryMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore'
>;

export function scoreQueryMethods(getDb: () => AdminFirestore | null): ScoreQueryMethods {
  return {
    async listScoresByEntry(contestId, entryId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .where('entryId', '==', entryId)
        .get();
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data() as Record<string, unknown>));
    },

    async listScoresByUser(contestId, userId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .where('userId', '==', userId)
        .get();
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data() as Record<string, unknown>));
    },

    async getScore(contestId, scoreId): Promise<ScoreEntry | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .doc(scoreId)
        .get();
      if (!snap.exists) return null;
      return docToScoreEntry(snap.id, snap.data() as Record<string, unknown>);
    },
  };
}
