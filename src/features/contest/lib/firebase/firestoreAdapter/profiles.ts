import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { UserProfile } from '../../backend/types';
import { USERS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from './adapter-contract';

type ProfileMethods = Pick<FirestoreAdapter, 'getProfile' | 'upsertProfile' | 'updateProfile'>;

// ---- User profiles ----

export function profileMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): ProfileMethods {
  return {
    async getProfile(uid): Promise<UserProfile | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    },

    async upsertProfile(uid, profile): Promise<UserProfile> {
      const db = requireDb();
      const ref = doc(db, USERS_COLLECTION, uid);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        await updateDoc(ref, { ...profile, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      const snap = await getDoc(ref);
      return snap.data() as UserProfile;
    },

    async updateProfile(uid, updates): Promise<UserProfile> {
      const db = requireDb();
      await updateDoc(doc(db, USERS_COLLECTION, uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (!snap.exists()) throw new Error('Profile not found');
      return snap.data() as UserProfile;
    },
  };
}
