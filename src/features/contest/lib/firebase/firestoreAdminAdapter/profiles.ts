import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { UserProfile } from '../../backend/types';
import { USERS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from '../firestoreAdapter';

type ProfileMethods = Pick<FirestoreAdapter, 'getProfile' | 'upsertProfile' | 'updateProfile'>;

// ---- User profiles ----

export function profileMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): ProfileMethods {
  return {
    async getProfile(uid): Promise<UserProfile | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
      if (!snap.exists) return null;
      return snap.data() as UserProfile;
    },

    async upsertProfile(uid, profile): Promise<UserProfile> {
      const db = requireDb();
      const ref = db.collection(USERS_COLLECTION).doc(uid);
      const existing = await ref.get();
      if (existing.exists) {
        await ref.update({ ...profile, updatedAt: FieldValue.serverTimestamp() });
      } else {
        await ref.set({
          ...profile,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      const snap = await ref.get();
      return snap.data() as UserProfile;
    },

    async updateProfile(uid, updates): Promise<UserProfile> {
      const db = requireDb();
      const ref = db.collection(USERS_COLLECTION).doc(uid);
      await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Profile not found');
      return snap.data() as UserProfile;
    },
  };
}
