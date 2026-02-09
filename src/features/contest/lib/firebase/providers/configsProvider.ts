/**
 * Firebase configs provider.
 *
 * Handles CRUD operations for contest configuration documents in Firestore.
 */

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
import type { ConfigsProvider, ContestConfigItem, ProviderResult } from '../../helpers/types';
import { generateId, withDb } from '../../helpers/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

const CONFIGS_COLLECTION = 'configs';

/**
 * Creates the Firebase configs provider.
 */
export function createFirebaseConfigsProvider(adapter: FirestoreAdapter): ConfigsProvider {
  const getDb = (): Firestore | null => adapter.getDb();

  return {
    async list(): Promise<ProviderResult<ContestConfigItem[]>> {
      return withDb(adapter, async () => {
        const db = getDb();
        if (!db) return [];

        const snapshot = await getDocs(collection(db, CONFIGS_COLLECTION));
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ContestConfigItem[];
      });
    },

    async getById(configId: string): Promise<ProviderResult<ContestConfigItem | null>> {
      return withDb(adapter, async () => {
        const db = getDb();
        if (!db) return null;

        const docSnap = await getDoc(doc(db, CONFIGS_COLLECTION, configId));
        if (!docSnap.exists()) return null;

        return { id: docSnap.id, ...docSnap.data() } as ContestConfigItem;
      });
    },

    async create(config: Omit<ContestConfigItem, 'id'> & { id?: string }): Promise<ProviderResult<ContestConfigItem>> {
      return withDb(adapter, async () => {
        const db = getDb();
        if (!db) throw new Error('Firebase not initialized');

        const id = config.id || generateId('config');

        // Validate required fields
        if (!config.topic || !config.attributes || config.attributes.length === 0) {
          throw new Error('Config must have a topic and at least one attribute');
        }

        const newConfig: ContestConfigItem = {
          id,
          topic: config.topic,
          attributes: config.attributes,
          entryLabel: config.entryLabel,
          entryLabelPlural: config.entryLabelPlural,
        };

        await setDoc(doc(db, CONFIGS_COLLECTION, id), {
          topic: newConfig.topic,
          attributes: newConfig.attributes,
          entryLabel: newConfig.entryLabel,
          entryLabelPlural: newConfig.entryLabelPlural,
        });

        return newConfig;
      });
    },

    async update(configId: string, updates: Partial<ContestConfigItem>): Promise<ProviderResult<ContestConfigItem>> {
      return withDb(adapter, async () => {
        const db = getDb();
        if (!db) throw new Error('Firebase not initialized');

        const docRef = doc(db, CONFIGS_COLLECTION, configId);
        const existing = await getDoc(docRef);
        if (!existing.exists()) {
          throw new Error('Config not found');
        }

        // Don't allow updating the ID
        const { id: _, ...updateData } = updates;
        await updateDoc(docRef, updateData);

        const updated = await getDoc(docRef);
        return { id: updated.id, ...updated.data() } as ContestConfigItem;
      });
    },

    async delete(configId: string): Promise<ProviderResult<void>> {
      return withDb(adapter, async () => {
        const db = getDb();
        if (!db) throw new Error('Firebase not initialized');

        const docRef = doc(db, CONFIGS_COLLECTION, configId);
        const existing = await getDoc(docRef);
        if (!existing.exists()) {
          throw new Error('Config not found');
        }

        await deleteDoc(docRef);
      });
    },
  };
}
