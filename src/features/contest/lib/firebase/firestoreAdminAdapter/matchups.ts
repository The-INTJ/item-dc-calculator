import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Entry, Matchup } from '../../../contexts/contest/contestTypes';
import type { MatchupCreateInput } from '../../backend/types';
import { generateId } from '../../backend/providerUtils';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION } from '../collection-names';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { buildInlineEntriesFromContestantIds } from '../firestoreAdapter';

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
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): MatchupMethods {
  return {
    async listMatchups(contestId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async listMatchupsByRound(contestId, roundId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .where('roundId', '==', roundId)
        .get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async getMatchup(contestId, matchupId): Promise<Matchup | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId)
        .get();
      if (!snap.exists) return null;
      return normalizeMatchupDoc(contestId, snap.id, snap.data() as Record<string, unknown>);
    },

    async createMatchup(contestId, input: MatchupCreateInput): Promise<Matchup> {
      const db = requireDb();
      const id = input.id ?? generateId('matchup');
      const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
      void _ignored;

      const entries = providedEntries
        ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);

      await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(id)
        .set({
          ...rest,
          entries,
          contestId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

      return { ...rest, entries, id, contestId } as Matchup;
    },

    async updateMatchup(contestId, matchupId, updates): Promise<Matchup> {
      const db = requireDb();
      const ref = db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId);

      const { id: _ignoredId, contestId: _ignoredContestId, ...rest } = updates;
      void _ignoredId;
      void _ignoredContestId;

      await ref.update({ ...rest, updatedAt: FieldValue.serverTimestamp() });
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Matchup not found');
      return normalizeMatchupDoc(contestId, snap.id, snap.data() as Record<string, unknown>);
    },

    async deleteMatchup(contestId, matchupId): Promise<void> {
      const db = requireDb();
      await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId)
        .delete();
    },

    async batchCreateMatchups(contestId, inputs: MatchupCreateInput[]): Promise<Matchup[]> {
      const db = requireDb();
      const batch = db.batch();
      const created: Matchup[] = [];

      for (const input of inputs) {
        const id = input.id ?? generateId('matchup');
        const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
        void _ignored;
        const entries = providedEntries
          ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);
        const ref = db
          .collection(CONTESTS_COLLECTION)
          .doc(contestId)
          .collection(MATCHUPS_SUBCOLLECTION)
          .doc(id);
        batch.set(ref, {
          ...rest,
          entries,
          contestId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created.push({ ...rest, entries, id, contestId } as Matchup);
      }

      await batch.commit();
      return created;
    },

    async setMatchupEntryName(contestId, matchupId, entryId, payload): Promise<Matchup> {
      const db = requireDb();
      const ref = db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId);

      return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new Error('Matchup not found');
        const data = snap.data() as Record<string, unknown>;
        const entries = ((data.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
        const idx = entries.findIndex((e) => e.id === entryId);
        if (idx === -1) throw new Error('Entry not found on matchup');
        entries[idx].name = payload.name;
        if (payload.description !== undefined) {
          entries[idx].description = payload.description;
        }
        transaction.update(ref, { entries, updatedAt: FieldValue.serverTimestamp() });
        return normalizeMatchupDoc(contestId, matchupId, { ...data, entries });
      });
    },
  };
}
