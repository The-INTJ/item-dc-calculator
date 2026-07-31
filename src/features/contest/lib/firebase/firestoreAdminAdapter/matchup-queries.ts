import { type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Matchup } from '../../../contexts/contest/contestTypes';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { matchupRef, matchupsCollection } from './matchup-refs';

export type MatchupQueryMethods = Pick<
  FirestoreAdapter,
  'listMatchups' | 'listMatchupsByRound' | 'getMatchup'
>;

/** Reads return empty/null rather than throwing when Firebase is not initialized. */
export function matchupQueryMethods(getDb: () => AdminFirestore | null): MatchupQueryMethods {
  return {
    async listMatchups(contestId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await matchupsCollection(db, contestId).get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async listMatchupsByRound(contestId, roundId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await matchupsCollection(db, contestId)
        .where('roundId', '==', roundId)
        .get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async getMatchup(contestId, matchupId): Promise<Matchup | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await matchupRef(db, contestId, matchupId).get();
      if (!snap.exists) return null;
      return normalizeMatchupDoc(contestId, snap.id, snap.data() as Record<string, unknown>);
    },
  };
}
