/**
 * Score transaction utilities for atomic score updates.
 */

import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Contest, Entry, ScoreEntry } from '../../../contexts/contest/contestTypes';

const CONTESTS_COLLECTION = 'contests';

/**
 * Options for updateEntryScores.
 */
export interface UpdateEntryScoresOptions<T> {
  db: Firestore;
  contestId: string;
  entryId: string;
  onUpdate: (contest: Contest, entryIndex: number, now: number) => {
    updatedScores: ScoreEntry[];
    result: T;
  };
}

/**
 * Executes a score update within a Firestore transaction.
 */
export async function updateEntryScores<T>({
  db,
  contestId,
  entryId,
  onUpdate,
}: UpdateEntryScoresOptions<T>): Promise<T> {
  let result: T | null = null;

  await runTransaction(db, async (transaction) => {
    const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
    const contestSnap = await transaction.get(contestRef);

    if (!contestSnap.exists()) {
      throw new Error('Contest not found');
    }

    const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
    const entryIndex = contest?.entries?.findIndex((entry: Entry) => entry.id === entryId);

    if (entryIndex === -1) {
      throw new Error('Entry not found');
    }

    const update = onUpdate(contest, entryIndex, Date.now());
    result = update.result;

    transaction.update(contestRef, {
      scores: update.updatedScores,
      updatedAt: serverTimestamp(),
    });
  });

  if (result === null) {
    throw new Error('Score update failed');
  }

  return result;
}
