/**
 * Score transaction utilities for atomic score updates with locking.
 *
 * Orchestrates locked updates to entry scores, handling retries and
 * maintaining consistency between scores array and entry.scoreTotals.
 */

import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Contest, Entry, ScoreBreakdown, ScoreEntry } from '../../globals';
import { createEmptyBreakdown, addBreakdowns, diffBreakdowns } from './breakdownUtils';
import {
  CONTESTS_COLLECTION,
  SCORE_LOCK_TTL_MS,
  SCORE_LOCK_MAX_RETRIES,
  ScoreLockError,
  buildLockBackoff,
  releaseEntryScoreLock,
} from './scoreLock';

/**
 * Applies a score update to an entry, updating scoreByUser and scoreTotals.
 * Returns a new Entry object with the updates applied.
 */
export function applyEntryScoreUpdate(
  entry: Entry,
  judgeId: string,
  breakdown: ScoreBreakdown,
  lockToken: string,
  now: number
): Entry {
  const scoreByUser = { ...(entry.scoreByUser ?? {}) };
  const previous = scoreByUser[judgeId] ?? createEmptyBreakdown();
  scoreByUser[judgeId] = breakdown;

  const baseTotals = entry.scoreTotals ?? createEmptyBreakdown();
  const delta = diffBreakdowns(breakdown, previous);
  const scoreTotals = addBreakdowns(baseTotals, delta);

  return {
    ...entry,
    scoreByUser,
    scoreTotals,
    scoreLock: {
      locked: true,
      token: lockToken,
      expiresAt: now + SCORE_LOCK_TTL_MS,
      updatedAt: now,
    },
  };
}

/**
 * Options for updateEntryScoresWithLock.
 */
export interface UpdateEntryScoresOptions<T> {
  db: Firestore;
  contestId: string;
  entryId: string;
  lockToken: string;
  onUpdate: (
    contest: Contest,
    entryIndex: number,
    now: number
  ) => {
    updatedScores: ScoreEntry[];
    updatedEntries: Entry[];
    result: T;
  };
}

/**
 * Executes a score update within a Firestore transaction with locking.
 * Retries with exponential backoff if the entry is locked by another update.
 */
export async function updateEntryScoresWithLock<T>({
  db,
  contestId,
  entryId,
  lockToken,
  onUpdate,
}: UpdateEntryScoresOptions<T>): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < SCORE_LOCK_MAX_RETRIES; attempt += 1) {
    try {
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

        const entry = contest.entries[entryIndex];
        const now = Date.now();
        const lockExpiresAt = entry.scoreLock?.expiresAt ?? 0;

        if (entry.scoreLock?.locked && lockExpiresAt > now) {
          throw new ScoreLockError();
        }

        const update = onUpdate(contest, entryIndex, now);
        result = update.result;

        transaction.update(contestRef, {
          entries: update.updatedEntries,
          scores: update.updatedScores,
          updatedAt: serverTimestamp(),
        });
      });

      if (result === null) {
        throw new Error('Score update failed');
      }

      await releaseEntryScoreLock(db, contestId, entryId, lockToken);
      return result;
    } catch (err) {
      lastError = err;

      if (err instanceof ScoreLockError) {
        const delay = buildLockBackoff(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Entry score lock retry limit exceeded');
}
