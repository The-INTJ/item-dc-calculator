import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Contest } from '../../../contexts/contest/contestTypes';
import { normalizeContest } from '../../domain/normalizeContest';
import { CONTESTS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from '../firestoreAdapter';

type ContestMethods = Pick<
  FirestoreAdapter,
  'getContest' | 'getContestBySlug' | 'getDefaultContest' | 'listContests' | 'createContest' | 'updateContest' | 'deleteContest'
>;

// ---- Contests ----

export function contestMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): ContestMethods {
  return {
    async getContest(contestId): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(CONTESTS_COLLECTION).doc(contestId).get();
      if (!snap.exists) return null;

      return normalizeContest(snap.id, snap.data() as Record<string, unknown>);
    },

    async getContestBySlug(slug): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snapshot = await db.collection(CONTESTS_COLLECTION).where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>);
    },

    async getDefaultContest(): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snapshot = await db.collection(CONTESTS_COLLECTION).where('defaultContest', '==', true).limit(1).get();
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>);
    },

    async listContests(): Promise<Contest[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db.collection(CONTESTS_COLLECTION).get();
      return snapshot.docs.map((docSnap) => normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>));
    },

    async createContest(id, data): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(id).set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async updateContest(contestId, updates): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(contestId).update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async deleteContest(contestId): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(contestId).delete();
    },
  };
}
