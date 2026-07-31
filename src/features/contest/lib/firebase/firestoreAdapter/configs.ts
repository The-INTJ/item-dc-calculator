import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import type { ContestConfigItem } from '../../../contexts/contest/contestTypes';
import { CONFIGS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from './adapter-contract';

type ConfigMethods = Pick<
  FirestoreAdapter,
  'getConfig' | 'listConfigs' | 'configExists' | 'createConfig' | 'updateConfig' | 'deleteConfig'
>;

// ---- Configs ----

export function configMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): ConfigMethods {
  return {
    async getConfig(configId): Promise<ContestConfigItem | null> {
      const db = getDb();
      if (!db) return null;

      const docSnap = await getDoc(doc(db, CONFIGS_COLLECTION, configId));
      if (!docSnap.exists()) return null;

      return { id: docSnap.id, ...docSnap.data() } as ContestConfigItem;
    },

    async listConfigs(): Promise<ContestConfigItem[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(collection(db, CONFIGS_COLLECTION));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ContestConfigItem[];
    },

    async configExists(configId): Promise<boolean> {
      const db = getDb();
      if (!db) return false;

      const snap = await getDoc(doc(db, CONFIGS_COLLECTION, configId));
      return snap.exists();
    },

    async createConfig(id, data): Promise<void> {
      const db = requireDb();
      await setDoc(doc(db, CONFIGS_COLLECTION, id), data);
    },

    async updateConfig(configId, updates): Promise<ContestConfigItem> {
      const db = requireDb();
      const docRef = doc(db, CONFIGS_COLLECTION, configId);
      const existing = await getDoc(docRef);
      if (!existing.exists()) throw new Error('Config not found');

      const { id: _ignored, ...updateData } = updates;
      void _ignored;
      await updateDoc(docRef, updateData);

      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as ContestConfigItem;
    },

    async deleteConfig(configId): Promise<void> {
      const db = requireDb();
      const docRef = doc(db, CONFIGS_COLLECTION, configId);
      const existing = await getDoc(docRef);
      if (!existing.exists()) throw new Error('Config not found');
      await deleteDoc(docRef);
    },
  };
}
