/**
 * Firebase backend provider implementation.
 *
 * This is the entry point that assembles the full MixologyBackendProvider
 * from individual sub-providers. Each provider is implemented in a separate
 * file under the `providers/` directory.
 */

import type { Firestore } from 'firebase/firestore';
import type { MixologyBackendProvider } from '../backend/types';
import { success } from '../backend/providerUtils';
import { initializeFirebase, isFirebaseConfigured } from './config';
import { createFirestoreAdapter } from './firestoreAdapter';
import {
  createFirebaseContestsProvider,
  createFirebaseEntriesProvider,
  createFirebaseJudgesProvider,
  createFirebaseScoresProvider,
} from './providers';

/**
 * Creates the full Firebase backend provider.
 */
export function createFirebaseBackendProvider(): MixologyBackendProvider {
  let db: Firestore | null = null;

  const getDb = () => db;
  const adapter = createFirestoreAdapter(getDb);

  const entriesProvider = createFirebaseEntriesProvider(adapter);

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(adapter),
    entries: entriesProvider,
    judges: createFirebaseJudgesProvider(adapter),
    scores: createFirebaseScoresProvider(adapter),

    async initialize() {
      const firebase = initializeFirebase();
      db = firebase.db;

      if (!isFirebaseConfigured() || !db) {
        console.warn('[FirebaseBackend] Firebase not configured or unavailable; using local-only mode.');
        return success(undefined);
      }

      console.log('[FirebaseBackend] Initialized');
      return success(undefined);
    },

    async dispose() {
      db = null;
    },
  };
}
