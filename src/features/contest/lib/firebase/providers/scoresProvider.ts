/**
 * Firebase scores provider — votes subcollection.
 *
 * Scores are stored as individual documents in `contests/{contestId}/votes/{userId}_{entryId}`.
 * Each write transactionally updates entry aggregates (sumScore, voteCount) on the contest document,
 * so the bracket view never needs to query all votes.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { ScoresProvider, ScoreEntry, ProviderResult } from '../../helpers/types';
import { success, error } from '../../helpers/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';
import type { Contest, Entry, ScoreBreakdown } from '../../../contexts/contest/contestTypes';

const CONTESTS_COLLECTION = 'contests';
const VOTES_SUBCOLLECTION = 'votes';

/**
 * Compute a per-user average score from their breakdown (unrounded).
 * This value is accumulated into `entry.sumScore` for efficient aggregate reads.
 */
function computeVoteTotal(breakdown: ScoreBreakdown): number {
  const values = Object.values(breakdown).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function makeVoteDocId(userId: string, entryId: string): string {
  return `${userId}_${entryId}`;
}

function docToScoreEntry(docId: string, data: Record<string, unknown>): ScoreEntry {
  return {
    id: docId,
    entryId: (data.entryId as string) ?? '',
    userId: (data.userId as string) ?? '',
    round: (data.round as string) ?? '',
    breakdown: (data.breakdown as ScoreBreakdown) ?? {},
    ...(data.notes ? { notes: data.notes as string } : {}),
  };
}

/**
 * Creates the Firebase scores provider backed by a votes subcollection.
 */
export function createFirebaseScoresProvider(adapter: FirestoreAdapter): ScoresProvider {
  function getDb() {
    const db = adapter.getDb();
    if (!db) throw new Error('Firebase not initialized');
    return db;
  }

  function votesCol(contestId: string) {
    return collection(getDb(), CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION);
  }

  return {
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      try {
        const q = query(votesCol(contestId), where('entryId', '==', entryId));
        const snapshot = await getDocs(q);
        const scores = snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
        return success(scores);
      } catch (err) {
        return error(String(err));
      }
    },

    async listByUser(contestId, userId): Promise<ProviderResult<ScoreEntry[]>> {
      try {
        const q = query(votesCol(contestId), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const scores = snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
        return success(scores);
      } catch (err) {
        return error(String(err));
      }
    },

    async getById(contestId, scoreId): Promise<ProviderResult<ScoreEntry | null>> {
      try {
        const docRef = doc(getDb(), CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return success(null);
        return success(docToScoreEntry(docSnap.id, docSnap.data()));
      } catch (err) {
        return error(String(err));
      }
    },

    /**
     * Submit (upsert) a vote. Within a single Firestore transaction:
     * 1. Read the existing vote doc (if any) and the contest doc
     * 2. Compute the delta between old and new per-user averages
     * 3. Write the vote doc (setDoc with merge)
     * 4. Update the entry's sumScore/voteCount aggregates on the contest doc
     */
    async submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      const db = getDb();
      const userId = input.userId;
      const entryId = input.entryId;
      const voteDocId = makeVoteDocId(userId, entryId);

      try {
        const result = await runTransaction(db, async (transaction) => {
          const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
          const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, voteDocId);

          const [contestSnap, voteSnap] = await Promise.all([
            transaction.get(contestRef),
            transaction.get(voteRef),
          ]);

          if (!contestSnap.exists()) throw new Error('Contest not found');
          const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;

          const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);
          if (entryIndex === undefined || entryIndex === -1) throw new Error('Entry not found');

          // Compute new total for this vote
          const newTotal = computeVoteTotal(input.breakdown);

          // Compute delta
          let delta: number;
          let isNewVote: boolean;

          if (voteSnap.exists()) {
            const oldBreakdown = (voteSnap.data().breakdown ?? {}) as ScoreBreakdown;
            const oldTotal = computeVoteTotal(oldBreakdown);
            delta = newTotal - oldTotal;
            isNewVote = false;
          } else {
            delta = newTotal;
            isNewVote = true;
          }

          // Write vote document
          const voteData: Record<string, unknown> = {
            userId,
            entryId,
            round: input.round ?? '',
            breakdown: input.breakdown,
            updatedAt: serverTimestamp(),
          };
          if (isNewVote) {
            voteData.createdAt = serverTimestamp();
          }
          transaction.set(voteRef, voteData, { merge: true });

          // Update entry aggregates in contest document
          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) + delta;
          entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);
          entries[entryIndex] = entry;

          transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });

          return docToScoreEntry(voteDocId, {
            userId,
            entryId,
            round: input.round ?? '',
            breakdown: input.breakdown,
          });
        });

        return success(result);
      } catch (err) {
        return error(String(err));
      }
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const db = getDb();

      try {
        const result = await runTransaction(db, async (transaction) => {
          const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
          const contestRef = doc(db, CONTESTS_COLLECTION, contestId);

          const [voteSnap, contestSnap] = await Promise.all([
            transaction.get(voteRef),
            transaction.get(contestRef),
          ]);

          if (!voteSnap.exists()) throw new Error('Vote not found');
          if (!contestSnap.exists()) throw new Error('Contest not found');

          const existingData = voteSnap.data();
          const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
          const entryId = existingData.entryId as string;

          const oldBreakdown = (existingData.breakdown ?? {}) as ScoreBreakdown;
          const newBreakdown: ScoreBreakdown = { ...oldBreakdown };
          if (updates.breakdown) {
            for (const [key, value] of Object.entries(updates.breakdown)) {
              if (typeof value === 'number') newBreakdown[key] = value;
            }
          }

          const oldTotal = computeVoteTotal(oldBreakdown);
          const newTotal = computeVoteTotal(newBreakdown);
          const delta = newTotal - oldTotal;

          // Update vote doc
          const voteUpdate: Record<string, unknown> = {
            breakdown: newBreakdown,
            updatedAt: serverTimestamp(),
          };
          if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
          transaction.set(voteRef, voteUpdate, { merge: true });

          // Update entry aggregates
          const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);
          if (entryIndex !== undefined && entryIndex !== -1) {
            const entries = [...contest.entries];
            const entry = { ...entries[entryIndex] };
            entry.sumScore = (entry.sumScore ?? 0) + delta;
            entries[entryIndex] = entry;
            transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });
          }

          return docToScoreEntry(scoreId, {
            ...existingData,
            breakdown: newBreakdown,
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
          });
        });

        return success(result);
      } catch (err) {
        return error(String(err));
      }
    },

    async delete(contestId, scoreId): Promise<ProviderResult<void>> {
      const db = getDb();

      try {
        await runTransaction(db, async (transaction) => {
          const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
          const contestRef = doc(db, CONTESTS_COLLECTION, contestId);

          const [voteSnap, contestSnap] = await Promise.all([
            transaction.get(voteRef),
            transaction.get(contestRef),
          ]);

          if (!voteSnap.exists()) throw new Error('Vote not found');
          if (!contestSnap.exists()) throw new Error('Contest not found');

          const voteData = voteSnap.data();
          const entryId = voteData.entryId as string;
          const oldBreakdown = (voteData.breakdown ?? {}) as ScoreBreakdown;
          const oldTotal = computeVoteTotal(oldBreakdown);

          const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
          const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);

          if (entryIndex !== undefined && entryIndex !== -1) {
            const entries = [...contest.entries];
            const entry = { ...entries[entryIndex] };
            entry.sumScore = (entry.sumScore ?? 0) - oldTotal;
            entry.voteCount = Math.max(0, (entry.voteCount ?? 0) - 1);
            entries[entryIndex] = entry;
            transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });
          }

          transaction.delete(voteRef);
        });

        return success(undefined);
      } catch (err) {
        return error(String(err));
      }
    },
  };
}
