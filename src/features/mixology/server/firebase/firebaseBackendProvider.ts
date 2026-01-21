/**
 * Firebase backend provider implementation.
 *
 * Implements MixologyBackendProvider using Firestore for data storage.
 */

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
  type Firestore,
} from 'firebase/firestore';

import type {
  MixologyBackendProvider,
  ContestsProvider,
  EntriesProvider,
  JudgesProvider,
  ScoresProvider,
  ProviderResult,
  Contest,
  Entry,
  Judge,
  ScoreEntry,
  ScoreBreakdown,
} from '../backend/types';
import { initializeFirebase, isFirebaseConfigured } from './config';

// Firestore collection names
const CONTESTS_COLLECTION = 'mixology_contests';
const SCORE_LOCK_TTL_MS = 2500;
const SCORE_LOCK_MAX_RETRIES = 5;
const SCORE_LOCK_BASE_DELAY_MS = 120;
const SCORE_LOCK_JITTER_MS = 140;

// Helper to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to wrap successful results
function success<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

// Helper to wrap error results
function error<T>(message: string): ProviderResult<T> {
  return { success: false, error: message };
}

class ScoreLockError extends Error {
  constructor() {
    super('Entry score is locked.');
    this.name = 'ScoreLockError';
  }
}

function createEmptyBreakdown(): ScoreBreakdown {
  return {
    aroma: 0,
    balance: 0,
    presentation: 0,
    creativity: 0,
    overall: 0,
  };
}

function addBreakdowns(base: ScoreBreakdown, delta: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(delta)]);
  for (const key of allKeys) {
    result[key] = (base[key] ?? 0) + (delta[key] ?? 0);
  }
  return result;
}

function diffBreakdowns(next: ScoreBreakdown, prev: ScoreBreakdown): ScoreBreakdown {
  const result: ScoreBreakdown = {};
  const allKeys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  for (const key of allKeys) {
    result[key] = (next[key] ?? 0) - (prev[key] ?? 0);
  }
  return result;
}

function applyEntryScoreUpdate(
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

function buildLockBackoff(attempt: number): number {
  const base = SCORE_LOCK_BASE_DELAY_MS * Math.pow(2, attempt);
  return base + Math.random() * SCORE_LOCK_JITTER_MS;
}

async function releaseEntryScoreLock(
  db: Firestore,
  contestId: string,
  entryId: string,
  lockToken: string
) {
  await runTransaction(db, async (transaction) => {
    const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
    const contestSnap = await transaction.get(contestRef);
    if (!contestSnap.exists()) return;
    const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
    const entryIndex = contest.entries.findIndex((entry) => entry.id === entryId);
    if (entryIndex === -1) return;
    const entry = contest.entries[entryIndex];
    if (entry.scoreLock?.token !== lockToken) return;
    const updatedEntry: Entry = {
      ...entry,
      scoreLock: {
        locked: false,
        expiresAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
    const updatedEntries = [...contest.entries];
    updatedEntries[entryIndex] = updatedEntry;
    transaction.update(contestRef, { entries: updatedEntries, updatedAt: serverTimestamp() });
  });
}

async function updateEntryScoresWithLock<T>({
  db,
  contestId,
  entryId,
  lockToken,
  onUpdate,
}: {
  db: Firestore;
  contestId: string;
  entryId: string;
  lockToken: string;
  onUpdate: (contest: Contest, entryIndex: number, now: number) => {
    updatedScores: ScoreEntry[];
    updatedEntries: Entry[];
    result: T;
  };
}): Promise<T> {
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
        const entryIndex = contest.entries.findIndex((entry) => entry.id === entryId);
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

/**
 * Creates Firebase contests provider
 */
function createFirebaseContestsProvider(getDb: () => Firestore | null): ContestsProvider {
  return {
    async list(): Promise<ProviderResult<Contest[]>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        const snapshot = await getDocs(collection(db, CONTESTS_COLLECTION));
        const contests: Contest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contest[];
        return success(contests);
      } catch (err) {
        return error(String(err));
      }
    },

    async getBySlug(slug: string): Promise<ProviderResult<Contest | null>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        const q = query(collection(db, CONTESTS_COLLECTION), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return success(null);

        const doc = snapshot.docs[0];
        return success({ id: doc.id, ...doc.data() } as Contest);
      } catch (err) {
        return error(String(err));
      }
    },

    async getDefault(): Promise<ProviderResult<Contest | null>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        const q = query(
          collection(db, CONTESTS_COLLECTION),
          where('defaultContest', '==', true)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return success(null);

        const doc = snapshot.docs[0];
        return success({ id: doc.id, ...doc.data() } as Contest);
      } catch (err) {
        return error(String(err));
      }
    },

    async create(input): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        const id = generateId('contest');
        const newContest: Contest = {
          ...input,
          id,
          entries: [],
          judges: [],
          scores: [],
        };

        await setDoc(doc(db, CONTESTS_COLLECTION, id), {
          ...newContest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return success(newContest);
      } catch (err) {
        return error(String(err));
      }
    },

    async update(id, updates): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        const docRef = doc(db, CONTESTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return error('Contest not found');

        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        const updated = await getDoc(docRef);
        return success({ id: updated.id, ...updated.data() } as Contest);
      } catch (err) {
        return error(String(err));
      }
    },

    async delete(id): Promise<ProviderResult<void>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        await deleteDoc(doc(db, CONTESTS_COLLECTION, id));
        return success(undefined);
      } catch (err) {
        return error(String(err));
      }
    },

    async setDefault(id): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) return error('Firebase not initialized');

      try {
        // First, unset all defaults
        const allContests = await getDocs(collection(db, CONTESTS_COLLECTION));
        for (const contestDoc of allContests.docs) {
          if (contestDoc.data().defaultContest) {
            await updateDoc(doc(db, CONTESTS_COLLECTION, contestDoc.id), {
              defaultContest: false,
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Set new default
        const docRef = doc(db, CONTESTS_COLLECTION, id);
        await updateDoc(docRef, {
          defaultContest: true,
          updatedAt: serverTimestamp(),
        });

        const updated = await getDoc(docRef);
        return success({ id: updated.id, ...updated.data() } as Contest);
      } catch (err) {
        return error(String(err));
      }
    },
  };
}

/**
 * Creates Firebase entries provider (stores entries as array in contest doc)
 */
function createFirebaseEntriesProvider(getDb: () => Firestore | null): EntriesProvider {
  const getContest = async (contestId: string): Promise<Contest | null> => {
    const db = getDb();
    if (!db) return null;
    const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Contest;
  };

  const updateContest = async (contestId: string, updates: Partial<Contest>) => {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    async listByContest(contestId): Promise<ProviderResult<Entry[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.entries);
    },

    async getById(contestId, entryId): Promise<ProviderResult<Entry | null>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.entries.find((e) => e.id === entryId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Entry>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newEntry: Entry = { ...input, id: generateId('entry') };
      const newEntries = [...contest.entries, newEntry];
      await updateContest(contestId, { entries: newEntries });

      return success(newEntry);
    },

    async update(contestId, entryId, updates): Promise<ProviderResult<Entry>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const idx = contest.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return error('Entry not found');

      const updatedEntry = { ...contest.entries[idx], ...updates };
      const newEntries = [...contest.entries];
      newEntries[idx] = updatedEntry;
      await updateContest(contestId, { entries: newEntries });

      return success(updatedEntry);
    },

    async delete(contestId, entryId): Promise<ProviderResult<void>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newEntries = contest.entries.filter((e) => e.id !== entryId);
      await updateContest(contestId, { entries: newEntries });

      return success(undefined);
    },
  };
}

/**
 * Creates Firebase judges provider (stores judges as array in contest doc)
 */
function createFirebaseJudgesProvider(getDb: () => Firestore | null): JudgesProvider {
  const getContest = async (contestId: string): Promise<Contest | null> => {
    const db = getDb();
    if (!db) return null;
    const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Contest;
  };

  const updateContest = async (contestId: string, updates: Partial<Contest>) => {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    async listByContest(contestId): Promise<ProviderResult<Judge[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.judges);
    },

    async getById(contestId, judgeId): Promise<ProviderResult<Judge | null>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.judges.find((j) => j.id === judgeId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Judge>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newJudge: Judge = { ...input, id: generateId('judge') };
      const newJudges = [...contest.judges, newJudge];
      await updateContest(contestId, { judges: newJudges });

      return success(newJudge);
    },

    async update(contestId, judgeId, updates): Promise<ProviderResult<Judge>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const idx = contest.judges.findIndex((j) => j.id === judgeId);
      if (idx === -1) return error('Judge not found');

      const updatedJudge = { ...contest.judges[idx], ...updates };
      const newJudges = [...contest.judges];
      newJudges[idx] = updatedJudge;
      await updateContest(contestId, { judges: newJudges });

      return success(updatedJudge);
    },

    async delete(contestId, judgeId): Promise<ProviderResult<void>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newJudges = contest.judges.filter((j) => j.id !== judgeId);
      await updateContest(contestId, { judges: newJudges });

      return success(undefined);
    },
  };
}

/**
 * Creates Firebase scores provider (stores scores as array in contest doc)
 */
function createFirebaseScoresProvider(getDb: () => Firestore | null): ScoresProvider {
  const getContest = async (contestId: string): Promise<Contest | null> => {
    const db = getDb();
    if (!db) return null;
    const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Contest;
  };

  const updateContest = async (contestId: string, updates: Partial<Contest>) => {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.entryId === entryId || s.drinkId === entryId));
    },

    // Deprecated alias
    async listByDrink(contestId, drinkId): Promise<ProviderResult<ScoreEntry[]>> {
      return this.listByEntry(contestId, drinkId);
    },

    async listByJudge(contestId, judgeId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.judgeId === judgeId));
    },

    async getById(contestId, scoreId): Promise<ProviderResult<ScoreEntry | null>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.find((s) => s.id === scoreId) ?? null);
    },

    async submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const db = getDb();
      if (!db) return error('Firebase not initialized');

      const inputEntryId = input.entryId ?? input.drinkId ?? '';

      try {
        const lockToken = generateId('score-lock');
        const result = await updateEntryScoresWithLock({
          db,
          contestId,
          entryId: inputEntryId,
          lockToken,
          onUpdate: (currentContest, entryIndex, now) => {
            const existingIndex = currentContest.scores.findIndex(
              (score) => (score.entryId === inputEntryId || score.drinkId === inputEntryId) && score.judgeId === input.judgeId
            );
            let updatedScores = [...currentContest.scores];
            let updatedScore: ScoreEntry;

            if (existingIndex !== -1) {
              const existingScore = currentContest.scores[existingIndex];
              updatedScore = {
                ...existingScore,
                entryId: inputEntryId,
                breakdown: input.breakdown,
                notes: input.notes ?? existingScore.notes,
              };
              updatedScores[existingIndex] = updatedScore;
            } else {
              updatedScore = { ...input, id: generateId('score'), entryId: inputEntryId };
              updatedScores = [...currentContest.scores, updatedScore];
            }

            const updatedEntry = applyEntryScoreUpdate(
              currentContest.entries[entryIndex],
              input.judgeId,
              updatedScore.breakdown,
              lockToken,
              now
            );
            const updatedEntries = [...currentContest.entries];
            updatedEntries[entryIndex] = updatedEntry;

            return { updatedScores, updatedEntries, result: updatedScore };
          },
        });
        return success(result);
      } catch (err) {
        return error(String(err));
      }
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const idx = contest.scores.findIndex((s) => s.id === scoreId);
      if (idx === -1) return error('Score not found');

      const db = getDb();
      if (!db) return error('Firebase not initialized');

      const scoreEntryId = contest.scores[idx].entryId ?? contest.scores[idx].drinkId ?? '';

      try {
        const lockToken = generateId('score-lock');
        const result = await updateEntryScoresWithLock({
          db,
          contestId,
          entryId: scoreEntryId,
          lockToken,
          onUpdate: (currentContest, entryIndex, now) => {
            const scoreIndex = currentContest.scores.findIndex((score) => score.id === scoreId);
            if (scoreIndex === -1) {
              throw new Error('Score not found');
            }

            const current = currentContest.scores[scoreIndex];
            // Merge breakdown updates, filtering out undefined values
            const mergedBreakdown: ScoreBreakdown = { ...current.breakdown };
            if (updates.breakdown) {
              for (const [key, value] of Object.entries(updates.breakdown)) {
                if (typeof value === 'number') {
                  mergedBreakdown[key] = value;
                }
              }
            }
            const updatedScore: ScoreEntry = {
              ...current,
              breakdown: mergedBreakdown,
              notes: updates.notes ?? current.notes,
            };

            const updatedScores = [...currentContest.scores];
            updatedScores[scoreIndex] = updatedScore;

            const updatedEntry = applyEntryScoreUpdate(
              currentContest.entries[entryIndex],
              updatedScore.judgeId,
              updatedScore.breakdown,
              lockToken,
              now
            );
            const updatedEntries = [...currentContest.entries];
            updatedEntries[entryIndex] = updatedEntry;

            return { updatedScores, updatedEntries, result: updatedScore };
          },
        });

        return success(result);
      } catch (err) {
        return error(String(err));
      }
    },

    async delete(contestId, scoreId): Promise<ProviderResult<void>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newScores = contest.scores.filter((s) => s.id !== scoreId);
      await updateContest(contestId, { scores: newScores });

      return success(undefined);
    },
  };
}

/**
 * Creates the full Firebase backend provider
 */
export function createFirebaseBackendProvider(): MixologyBackendProvider {
  let db: Firestore | null = null;

  const getDb = () => db;

  const entriesProvider = createFirebaseEntriesProvider(getDb);

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(getDb),
    entries: entriesProvider,
    drinks: entriesProvider, // Deprecated alias
    judges: createFirebaseJudgesProvider(getDb),
    scores: createFirebaseScoresProvider(getDb),

    async initialize(): Promise<ProviderResult<void>> {
      const firebase = initializeFirebase();
      db = firebase.db;

      if (!isFirebaseConfigured() || !db) {
        console.warn('[FirebaseBackend] Firebase not configured or unavailable; using local-only mode.');
        // Return success anyway - API routes won't use this
        return success(undefined);
      }

      console.log('[FirebaseBackend] Initialized');
      return success(undefined);
    },

    async dispose(): Promise<void> {
      db = null;
    },
  };
}
