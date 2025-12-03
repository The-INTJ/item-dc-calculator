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
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

import type {
  MixologyBackendProvider,
  ContestsProvider,
  DrinksProvider,
  JudgesProvider,
  ScoresProvider,
  ProviderResult,
  Contest,
  Drink,
  Judge,
  ScoreEntry,
  ScoreBreakdown,
} from '../backend/types';
import { initializeFirebase } from './config';

// Firestore collection names
const CONTESTS_COLLECTION = 'mixology_contests';

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
          drinks: [],
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
 * Creates Firebase drinks provider (stores drinks as array in contest doc)
 */
function createFirebaseDrinksProvider(getDb: () => Firestore | null): DrinksProvider {
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
    async listByContest(contestId): Promise<ProviderResult<Drink[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.drinks);
    },

    async getById(contestId, drinkId): Promise<ProviderResult<Drink | null>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.drinks.find((d) => d.id === drinkId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Drink>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newDrink: Drink = { ...input, id: generateId('drink') };
      const newDrinks = [...contest.drinks, newDrink];
      await updateContest(contestId, { drinks: newDrinks });

      return success(newDrink);
    },

    async update(contestId, drinkId, updates): Promise<ProviderResult<Drink>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const idx = contest.drinks.findIndex((d) => d.id === drinkId);
      if (idx === -1) return error('Drink not found');

      const updatedDrink = { ...contest.drinks[idx], ...updates };
      const newDrinks = [...contest.drinks];
      newDrinks[idx] = updatedDrink;
      await updateContest(contestId, { drinks: newDrinks });

      return success(updatedDrink);
    },

    async delete(contestId, drinkId): Promise<ProviderResult<void>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const newDrinks = contest.drinks.filter((d) => d.id !== drinkId);
      await updateContest(contestId, { drinks: newDrinks });

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
    async listByDrink(contestId, drinkId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.drinkId === drinkId));
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

      const newScore: ScoreEntry = { ...input, id: generateId('score') };
      const newScores = [...contest.scores, newScore];
      await updateContest(contestId, { scores: newScores });

      return success(newScore);
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const contest = await getContest(contestId);
      if (!contest) return error('Contest not found');

      const idx = contest.scores.findIndex((s) => s.id === scoreId);
      if (idx === -1) return error('Score not found');

      const current = contest.scores[idx];
      const updatedScore: ScoreEntry = {
        ...current,
        breakdown: { ...current.breakdown, ...updates } as ScoreBreakdown,
        notes: updates.notes ?? current.notes,
      };

      const newScores = [...contest.scores];
      newScores[idx] = updatedScore;
      await updateContest(contestId, { scores: newScores });

      return success(updatedScore);
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

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(getDb),
    drinks: createFirebaseDrinksProvider(getDb),
    judges: createFirebaseJudgesProvider(getDb),
    scores: createFirebaseScoresProvider(getDb),

    async initialize(): Promise<ProviderResult<void>> {
      const firebase = initializeFirebase();
      db = firebase.db;

      if (!db) {
        console.warn('[FirebaseBackend] Running on server or Firebase not available');
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
