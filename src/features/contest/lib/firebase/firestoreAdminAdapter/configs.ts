import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { ContestConfigItem } from '../../../contexts/contest/contestTypes';
import { CONFIGS_COLLECTION } from '../collection-names';
import type { FirestoreAdapter } from '../firestoreAdapter';

type ConfigMethods = Pick<
  FirestoreAdapter,
  'getConfig' | 'listConfigs' | 'configExists' | 'createConfig' | 'updateConfig' | 'deleteConfig'
>;

// ---- Configs ----

export function configMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): ConfigMethods {
  return {
    async getConfig(configId): Promise<ContestConfigItem | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(CONFIGS_COLLECTION).doc(configId).get();
      if (!snap.exists) return null;

      return { id: snap.id, ...snap.data() } as ContestConfigItem;
    },

    async listConfigs(): Promise<ContestConfigItem[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db.collection(CONFIGS_COLLECTION).get();
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ContestConfigItem[];
    },

    async configExists(configId): Promise<boolean> {
      const db = getDb();
      if (!db) return false;

      const snap = await db.collection(CONFIGS_COLLECTION).doc(configId).get();
      return snap.exists;
    },

    async createConfig(id, data): Promise<void> {
      const db = requireDb();
      await db.collection(CONFIGS_COLLECTION).doc(id).set(data);
    },

    async updateConfig(configId, updates): Promise<ContestConfigItem> {
      const db = requireDb();
      const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
      const existing = await docRef.get();
      if (!existing.exists) throw new Error('Config not found');

      const { id: _ignored, ...updateData } = updates;
      void _ignored;
      await docRef.update(updateData);

      const updated = await docRef.get();
      return { id: updated.id, ...updated.data() } as ContestConfigItem;
    },

    async deleteConfig(configId): Promise<void> {
      const db = requireDb();
      const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
      const existing = await docRef.get();
      if (!existing.exists) throw new Error('Config not found');
      await docRef.delete();
    },
  };
}
