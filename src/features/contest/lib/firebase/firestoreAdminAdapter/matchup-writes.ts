import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Entry, Matchup } from '../../../contexts/contest/contestTypes';
import type { MatchupCreateInput } from '../../backend/types';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { prepareNewMatchup } from '../firestoreAdapter';
import { matchupRef } from './matchup-refs';

export type MatchupWriteMethods = Pick<
  FirestoreAdapter,
  | 'createMatchup'
  | 'updateMatchup'
  | 'deleteMatchup'
  | 'batchCreateMatchups'
  | 'setMatchupEntryName'
>;

export function matchupWriteMethods(requireDb: () => AdminFirestore): MatchupWriteMethods {
  return {
    async createMatchup(contestId, input: MatchupCreateInput): Promise<Matchup> {
      const db = requireDb();
      const { id, entries, rest } = prepareNewMatchup(input);

      await matchupRef(db, contestId, id).set({
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
      const ref = matchupRef(db, contestId, matchupId);

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
      await matchupRef(db, contestId, matchupId).delete();
    },

    async batchCreateMatchups(contestId, inputs: MatchupCreateInput[]): Promise<Matchup[]> {
      const db = requireDb();
      const batch = db.batch();
      const created: Matchup[] = [];

      for (const input of inputs) {
        const { id, entries, rest } = prepareNewMatchup(input);
        batch.set(matchupRef(db, contestId, id), {
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
      const ref = matchupRef(db, contestId, matchupId);

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
