import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Entry, ScoreBreakdown, ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { computeVoteTotal, docToScoreEntry } from '../scoreHelpers';
import type { FirestoreAdapter } from './adapter-contract';

type ScoreRecordMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore' | 'updateScore' | 'deleteScore'
>;

// ---- Scores / votes ----

export function scoreRecordMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): ScoreRecordMethods {
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

    async updateScore(contestId, scoreId, updates): Promise<ScoreEntry> {
      const db = requireDb();

      return runTransaction(db, async (transaction) => {
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists()) throw new Error('Vote not found');

        const existingData = voteSnap.data();
        const entryId = existingData.entryId as string;
        const matchupId = existingData.matchupId as string | undefined;

        const oldBreakdown = (existingData.breakdown ?? {}) as ScoreBreakdown;
        const newBreakdown: ScoreBreakdown = { ...oldBreakdown };
        if (updates.breakdown) {
          for (const [key, value] of Object.entries(updates.breakdown)) {
            if (typeof value === 'number') newBreakdown[key] = value;
          }
        }

        const delta = computeVoteTotal(newBreakdown) - computeVoteTotal(oldBreakdown);

        const voteUpdate: Record<string, unknown> = {
          breakdown: newBreakdown,
          updatedAt: serverTimestamp(),
        };
        if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
        transaction.set(voteRef, voteUpdate, { merge: true });

        if (matchupId) {
          const matchupRef = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists()) {
            const entries = (((matchupSnap.data().entries as Entry[] | undefined) ?? []).map((e) => ({
              ...e,
            })) as Entry[]);
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) + delta;
              transaction.update(matchupRef, { entries, updatedAt: serverTimestamp() });
            }
          }
        }

        return docToScoreEntry(scoreId, {
          ...existingData,
          breakdown: newBreakdown,
          ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        });
      });
    },

    async deleteScore(contestId, scoreId): Promise<void> {
      const db = requireDb();

      await runTransaction(db, async (transaction) => {
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists()) throw new Error('Vote not found');

        const voteData = voteSnap.data();
        const entryId = voteData.entryId as string;
        const matchupId = voteData.matchupId as string | undefined;
        const oldBreakdown = (voteData.breakdown ?? {}) as ScoreBreakdown;
        const oldTotal = computeVoteTotal(oldBreakdown);

        if (matchupId) {
          const matchupRef = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists()) {
            const entries = (((matchupSnap.data().entries as Entry[] | undefined) ?? []).map((e) => ({
              ...e,
            })) as Entry[]);
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) - oldTotal;
              entries[entryIndex].voteCount = Math.max(0, (entries[entryIndex].voteCount ?? 0) - 1);
              transaction.update(matchupRef, { entries, updatedAt: serverTimestamp() });
            }
          }
        }

        transaction.delete(voteRef);
      });
    },
  };
}
