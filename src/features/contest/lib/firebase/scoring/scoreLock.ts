/**
 * Score locking utilities for preventing concurrent score updates.
 *
 * Uses optimistic locking with exponential backoff for contention.
 */

import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Contest, Entry } from '../../../contexts/contest/contestTypes';

// Constants for score locking
export const SCORE_LOCK_TTL_MS = 2500;
export const SCORE_LOCK_MAX_RETRIES = 5;
export const SCORE_LOCK_BASE_DELAY_MS = 120;
export const SCORE_LOCK_JITTER_MS = 140;

// Firestore collection name (must match other files)
export const CONTESTS_COLLECTION = 'contests';

/**
 * Error thrown when a score lock cannot be acquired.
 */
export class ScoreLockError extends Error {
  constructor() {
    super('Entry score is locked.');
    this.name = 'ScoreLockError';
  }
}

/**
 * Calculates exponential backoff delay with jitter for retry attempts.
 */
export function buildLockBackoff(attempt: number): number {
  const base = SCORE_LOCK_BASE_DELAY_MS * Math.pow(2, attempt);
  return base + Math.random() * SCORE_LOCK_JITTER_MS;
}

/**
 * Releases a score lock on an entry after a successful update.
 */
export async function releaseEntryScoreLock(
  db: Firestore,
  contestId: string,
  entryId: string,
  lockToken: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
    const contestSnap = await transaction.get(contestRef);
    if (!contestSnap.exists()) return;

    const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
    const entryIndex = contest?.entries?.findIndex((entry: Entry) => entry.id === entryId);
    if (entryIndex === -1) return;

    const entry = contest.entries[entryIndex];
    if (entry.scoreLock?.token !== lockToken) return;

    const updatedEntries = [...contest.entries];
    updatedEntries[entryIndex] = {
      ...entry,
      scoreLock: {
        locked: false,
        expiresAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    transaction.update(contestRef, { entries: updatedEntries, updatedAt: serverTimestamp() });
  });
}
