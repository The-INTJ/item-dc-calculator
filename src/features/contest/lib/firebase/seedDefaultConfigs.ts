/**
 * Seeds default contest configurations into Firestore.
 *
 * This module is responsible for creating the default contest configurations
 * on first app run. It's idempotent - if configs already exist, seeding is skipped.
 */

import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import type { FirestoreAdapter } from './firestoreAdapter';
import { DEFAULT_CONFIGS } from './defaultConfigs';

const CONFIGS_COLLECTION = 'configs';

/**
 * Seeds default contest configurations into Firestore.
 *
 * This function checks if the configs collection is empty. If it is, it creates
 * the default configs. If configs already exist, it returns early (idempotent).
 *
 * @param adapter - The Firestore adapter for database operations
 * @throws Error if seeding fails (but the function is wrapped in try-catch in the provider)
 */
export async function seedDefaultConfigs(adapter: FirestoreAdapter): Promise<void> {
  const db = adapter.getDb();
  if (!db) {
    console.log('[Seed] Firebase not initialized, skipping seeding');
    return;
  }

  try {
    const configsSnapshot = await getDocs(collection(db, CONFIGS_COLLECTION));

    if (!configsSnapshot.empty) {
      console.log(`[Seed] Configs collection already has ${configsSnapshot.size} configs, skipping seeding`);
      return;
    }

    for (const config of DEFAULT_CONFIGS) {
      await setDoc(doc(db, CONFIGS_COLLECTION, config.id), config);
      console.log(`[Seed] Created config: ${config.id}`);
    }

    console.log(`[Seed] Successfully seeded ${DEFAULT_CONFIGS.length} configs`);
  } catch (error) {
    console.error('[Seed] Error seeding default configs:', error);
    throw error;
  }
}

