/**
 * Firestore adapter providing a thin abstraction over Firestore operations.
 *
 * This isolates Firestore-specific code and makes providers easier to test.
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
  type Transaction,
} from 'firebase/firestore';
import type { Contest } from '../globals';
import { CONTESTS_COLLECTION } from './scoring';

/**
 * Firestore adapter interface for contest operations.
 */
export interface FirestoreAdapter {
  /** Returns the underlying Firestore instance, or null if not initialized. */
  getDb(): Firestore | null;

  /** Fetches a contest by ID. Returns null if not found. */
  getContest(contestId: string): Promise<Contest | null>;

  /** Fetches a contest by slug. Returns null if not found. */
  getContestBySlug(slug: string): Promise<Contest | null>;

  /** Fetches the default contest. Returns null if none set. */
  getDefaultContest(): Promise<Contest | null>;

  /** Fetches all contests. */
  listContests(): Promise<Contest[]>;

  /** Creates a new contest document. */
  createContest(id: string, data: Omit<Contest, 'id'>): Promise<void>;

  /** Updates a contest document with partial data. */
  updateContest(contestId: string, updates: Partial<Contest>): Promise<void>;

  /** Deletes a contest document. */
  deleteContest(contestId: string): Promise<void>;

  /** Runs a transaction on a contest document. */
  runContestTransaction<T>(
    contestId: string,
    callback: (contest: Contest, transaction: Transaction, contestRef: ReturnType<typeof doc>) => T | Promise<T>
  ): Promise<T>;
}

/**
 * Creates a Firestore adapter with the given database getter.
 */
export function createFirestoreAdapter(getDb: () => Firestore | null): FirestoreAdapter {
  return {
    getDb,

    async getContest(contestId: string): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
      if (!docSnap.exists()) return null;

      return { id: docSnap.id, ...docSnap.data() } as Contest;
    },

    async getContestBySlug(slug: string): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Contest;
    },

    async getDefaultContest(): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('defaultContest', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Contest;
    },

    async listContests(): Promise<Contest[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(collection(db, CONTESTS_COLLECTION));
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Contest[];
    },

    async createContest(id: string, data: Omit<Contest, 'id'>): Promise<void> {
      const db = getDb();
      if (!db) throw new Error('Firebase not initialized');

      await setDoc(doc(db, CONTESTS_COLLECTION, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    async updateContest(contestId: string, updates: Partial<Contest>): Promise<void> {
      const db = getDb();
      if (!db) throw new Error('Firebase not initialized');

      await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },

    async deleteContest(contestId: string): Promise<void> {
      const db = getDb();
      if (!db) throw new Error('Firebase not initialized');

      await deleteDoc(doc(db, CONTESTS_COLLECTION, contestId));
    },

    async runContestTransaction<T>(
      contestId: string,
      callback: (contest: Contest, transaction: Transaction, contestRef: ReturnType<typeof doc>) => T | Promise<T>
    ): Promise<T> {
      const db = getDb();
      if (!db) throw new Error('Firebase not initialized');

      return runTransaction(db, async (transaction) => {
        const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
        const contestSnap = await transaction.get(contestRef);

        if (!contestSnap.exists()) {
          throw new Error('Contest not found');
        }

        const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
        return callback(contest, transaction, contestRef);
      });
    },
  };
}
