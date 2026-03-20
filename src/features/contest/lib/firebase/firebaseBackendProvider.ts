/**
 * Firebase backend provider implementation.
 *
 * This is the entry point that assembles the full BackendProvider
 * from individual sub-providers. Each provider is implemented in a separate
 * file under the `providers/` directory.
 */

import type { Firestore } from 'firebase/firestore';
import type { BackendProvider } from '../backend/types';
import { success } from '../backend/providerUtils';
import { initializeFirebase, isFirebaseConfigured } from './config';
import { createFirestoreAdapter } from './firestoreAdapter';
import { createFirebaseContestsProvider } from './providers/contestsProvider';
import { createFirebaseEntriesProvider } from './providers/entriesProvider';
import { createFirebaseVotersProvider } from './providers/votersProvider';
import { createFirebaseScoresProvider } from './providers/scoresProvider';
import { createFirebaseConfigsProvider } from './providers/configsProvider';
import { seedDefaultConfigs } from './seedDefaultConfigs';

/**
 * Creates the full Firebase backend provider.
 */
export function createFirebaseBackendProvider(): BackendProvider {
  let db: Firestore | null = null;

  const getDb = () => db;
  const adapter = createFirestoreAdapter(getDb);

  const entriesProvider = createFirebaseEntriesProvider(adapter);

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(adapter),
    entries: entriesProvider,
    voters: createFirebaseVotersProvider(adapter),
    scores: createFirebaseScoresProvider(adapter),
    configs: createFirebaseConfigsProvider(adapter),

    async initialize() {
      const firebase = initializeFirebase();
      db = firebase.db;

      if (!isFirebaseConfigured() || !db) {
        console.warn('[FirebaseBackend] Firebase not configured or unavailable; using local-only mode.');
        return success(undefined);
      }

      // Seed default configs if collection is empty (client-side only,
      // server-side has no auth context for Firestore security rules)
      if (typeof window !== 'undefined') {
        try {
          await seedDefaultConfigs(adapter);
        } catch (err) {
          console.error('[FirebaseBackend] Failed to seed default configs:', err);
        }
      }

      console.log('[FirebaseBackend] Initialized');
      return success(undefined);
    },

    async dispose() {
      db = null;
    },
  };
}
