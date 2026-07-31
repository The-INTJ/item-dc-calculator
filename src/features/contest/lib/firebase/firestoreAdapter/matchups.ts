import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { Entry, Matchup } from '../../../contexts/contest/contestTypes';
import { generateId } from '../../backend/providerUtils';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION } from '../collection-names';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from './adapter-contract';
import { buildInlineEntriesFromContestantIds } from './matchup-entries';

type MatchupMethods = Pick<
  FirestoreAdapter,
  | 'listMatchups'
  | 'listMatchupsByRound'
  | 'getMatchup'
  | 'createMatchup'
  | 'updateMatchup'
  | 'deleteMatchup'
  | 'batchCreateMatchups'
  | 'setMatchupEntryName'
>;

// ---- Matchups ----

export function matchupMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): MatchupMethods {
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

    async createMatchup(contestId, input): Promise<Matchup> {
      const db = requireDb();
      const id = input.id ?? generateId('matchup');
      const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
      void _ignored;

      const entries = providedEntries
        ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);

      const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, id);
      await setDoc(ref, {
        ...rest,
        entries,
        contestId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { ...rest, entries, id, contestId } as Matchup;
    },

    async updateMatchup(contestId, matchupId, updates): Promise<Matchup> {
      const db = requireDb();
      const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);

      const { id: _ignoredId, contestId: _ignoredContestId, ...rest } = updates;
      void _ignoredId;
      void _ignoredContestId;

      await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Matchup not found');
      return normalizeMatchupDoc(contestId, snap.id, snap.data());
    },

    async deleteMatchup(contestId, matchupId): Promise<void> {
      const db = requireDb();
      await deleteDoc(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId));
    },

    async batchCreateMatchups(contestId, inputs): Promise<Matchup[]> {
      const db = requireDb();
      const batch = writeBatch(db);
      const created: Matchup[] = [];

      for (const input of inputs) {
        const id = input.id ?? generateId('matchup');
        const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
        void _ignored;
        const entries = providedEntries
          ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);
        const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, id);
        batch.set(ref, {
          ...rest,
          entries,
          contestId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created.push({ ...rest, entries, id, contestId } as Matchup);
      }

      await batch.commit();
      return created;
    },

    async setMatchupEntryName(contestId, matchupId, entryId, payload): Promise<Matchup> {
      const db = requireDb();
      const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);

      return runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) throw new Error('Matchup not found');
        const data = snap.data();
        const entries = ((data.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
        const idx = entries.findIndex((e) => e.id === entryId);
        if (idx === -1) throw new Error('Entry not found on matchup');
        entries[idx].name = payload.name;
        if (payload.description !== undefined) {
          entries[idx].description = payload.description;
        }
        transaction.update(ref, { entries, updatedAt: serverTimestamp() });
        return normalizeMatchupDoc(contestId, matchupId, { ...data, entries });
      });
    },
  };
}
