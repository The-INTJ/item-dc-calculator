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
import type { Contest } from '../../../contexts/contest/contestTypes';
import { normalizeContest } from '../../domain/normalizeContest';
import { CONTESTS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from './adapter-contract';

type ContestMethods = Pick<
  FirestoreAdapter,
  'getContest' | 'getContestBySlug' | 'getDefaultContest' | 'listContests' | 'createContest' | 'updateContest' | 'deleteContest'
>;

// ---- Contests ----

export function contestMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): ContestMethods {
  return {
    async getContest(contestId): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
      if (!docSnap.exists()) return null;

      return normalizeContest(docSnap.id, docSnap.data());
    },

    async getContestBySlug(slug): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data());
    },

    async getDefaultContest(): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('defaultContest', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data());
    },

    async listContests(): Promise<Contest[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(collection(db, CONTESTS_COLLECTION));
      return snapshot.docs.map((docSnap) => normalizeContest(docSnap.id, docSnap.data()));
    },

    async createContest(id, data): Promise<void> {
      const db = requireDb();
      await setDoc(doc(db, CONTESTS_COLLECTION, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    async updateContest(contestId, updates): Promise<void> {
      const db = requireDb();
      await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },

    async deleteContest(contestId): Promise<void> {
      const db = requireDb();
      await deleteDoc(doc(db, CONTESTS_COLLECTION, contestId));
    },
  };
}
