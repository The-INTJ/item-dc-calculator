import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Matchup } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION } from '../collection-names';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from './adapter-contract';

export type MatchupQueryMethods = Pick<
  FirestoreAdapter,
  'listMatchups' | 'listMatchupsByRound' | 'getMatchup'
>;

/** Reads return empty/null rather than throwing when Firebase is not initialized. */
export function matchupQueryMethods(getDb: () => Firestore | null): MatchupQueryMethods {
  return {
    async listMatchups(contestId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(
        collection(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION),
      );
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data()));
    },

    async listMatchupsByRound(contestId, roundId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION),
        where('roundId', '==', roundId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data()));
    },

    async getMatchup(contestId, matchupId): Promise<Matchup | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId));
      if (!snap.exists()) return null;
      return normalizeMatchupDoc(contestId, snap.id, snap.data());
    },
  };
}
