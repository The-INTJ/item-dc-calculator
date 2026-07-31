import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { docToScoreEntry } from '../scoreHelpers';
import type { FirestoreAdapter } from './adapter-contract';

export type ScoreQueryMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore'
>;

export function scoreQueryMethods(getDb: () => Firestore | null): ScoreQueryMethods {
  return {
    async listScoresByEntry(contestId, entryId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION),
        where('entryId', '==', entryId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
    },

    async listScoresByUser(contestId, userId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
    },

    async getScore(contestId, scoreId): Promise<ScoreEntry | null> {
      const db = getDb();
      if (!db) return null;

      const docRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToScoreEntry(docSnap.id, docSnap.data());
    },
  };
}
