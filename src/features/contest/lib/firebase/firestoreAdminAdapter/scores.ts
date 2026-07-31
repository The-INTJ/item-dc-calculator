import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Entry, ScoreBreakdown, ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { computeVoteTotal, docToScoreEntry } from '../scoreHelpers';
import type { FirestoreAdapter } from '../firestoreAdapter';

type ScoreRecordMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore' | 'updateScore' | 'deleteScore'
>;

// ---- Scores / votes ----

export function scoreRecordMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): ScoreRecordMethods {
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

    async updateScore(contestId, scoreId, updates): Promise<ScoreEntry> {
      const db = requireDb();

      return db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists) throw new Error('Vote not found');

        const existingData = voteSnap.data() as Record<string, unknown>;
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
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
        transaction.set(voteRef, voteUpdate, { merge: true });

        if (matchupId) {
          const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists) {
            const entries = (((matchupSnap.data() as Record<string, unknown>).entries as Entry[] | undefined) ?? [])
              .map((e) => ({ ...e })) as Entry[];
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) + delta;
              transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
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

      await db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists) throw new Error('Vote not found');

        const voteData = voteSnap.data() as Record<string, unknown>;
        const entryId = voteData.entryId as string;
        const matchupId = voteData.matchupId as string | undefined;
        const oldBreakdown = (voteData.breakdown ?? {}) as ScoreBreakdown;
        const oldTotal = computeVoteTotal(oldBreakdown);

        if (matchupId) {
          const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists) {
            const entries = (((matchupSnap.data() as Record<string, unknown>).entries as Entry[] | undefined) ?? [])
              .map((e) => ({ ...e })) as Entry[];
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) - oldTotal;
              entries[entryIndex].voteCount = Math.max(0, (entries[entryIndex].voteCount ?? 0) - 1);
              transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
            }
          }
        }

        transaction.delete(voteRef);
      });
    },
  };
}
