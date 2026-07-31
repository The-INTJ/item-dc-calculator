import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { ScoreBreakdown, ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { computeVoteTotal, docToScoreEntry } from '../scoreHelpers';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { adjustMatchupEntryTally } from './matchup-entry-tally';

export type ScoreMutationMethods = Pick<FirestoreAdapter, 'updateScore' | 'deleteScore'>;

/** Only the numeric fields of an update are merged; anything else is ignored. */
function mergeBreakdown(
  existing: ScoreBreakdown,
  updates?: Partial<ScoreBreakdown>,
): ScoreBreakdown {
  const merged: ScoreBreakdown = { ...existing };
  if (updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'number') merged[key] = value;
    }
  }
  return merged;
}

export function scoreMutationMethods(requireDb: () => AdminFirestore): ScoreMutationMethods {
  return {
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
        const newBreakdown = mergeBreakdown(oldBreakdown, updates.breakdown);
        const delta = computeVoteTotal(newBreakdown) - computeVoteTotal(oldBreakdown);

        const voteUpdate: Record<string, unknown> = {
          breakdown: newBreakdown,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
        transaction.set(voteRef, voteUpdate, { merge: true });

        if (matchupId) {
          await adjustMatchupEntryTally(transaction, contestRef, { matchupId, entryId }, (entry) => {
            entry.sumScore = (entry.sumScore ?? 0) + delta;
          });
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
        const oldTotal = computeVoteTotal((voteData.breakdown ?? {}) as ScoreBreakdown);

        if (matchupId) {
          await adjustMatchupEntryTally(transaction, contestRef, { matchupId, entryId }, (entry) => {
            entry.sumScore = (entry.sumScore ?? 0) - oldTotal;
            entry.voteCount = Math.max(0, (entry.voteCount ?? 0) - 1);
          });
        }

        transaction.delete(voteRef);
      });
    },
  };
}
