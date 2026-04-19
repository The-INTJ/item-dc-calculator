/**
 * Firebase backend provider implementation.
 *
 * This assembles the full BackendProvider from individual sub-providers
 * backed by a FirestoreAdapter. On the server (API routes) it uses the
 * Admin SDK adapter — which bypasses security rules as designed. In the
 * browser it uses the client SDK adapter, so rule-protected realtime
 * subscriptions continue to work the same way they always did.
 */

import type { Firestore } from 'firebase/firestore';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { BackendProvider } from '../backend/types';
import { success } from '../backend/providerUtils';
import { initializeFirebase, isFirebaseConfigured } from './config';
import { getFirebaseAdminFirestore, isFirebaseAdminConfigured } from './admin';
import { createFirestoreAdapter, type FirestoreAdapter } from './firestoreAdapter';
import { createFirestoreAdminAdapter } from './firestoreAdminAdapter';
import { createFirebaseContestsProvider } from './providers/contestsProvider';
import { createFirebaseEntriesProvider } from './providers/entriesProvider';
import { createFirebaseVotersProvider } from './providers/votersProvider';
import { createFirebaseScoresProvider } from './providers/scoresProvider';
import { createFirebaseConfigsProvider } from './providers/configsProvider';
import { seedDefaultConfigs } from './seedDefaultConfigs';

const isServer = typeof window === 'undefined';

export function createFirebaseBackendProvider(): BackendProvider {
  let clientDb: Firestore | null = null;
  let adminDb: AdminFirestore | null = null;

  const adapter: FirestoreAdapter = isServer
    ? createFirestoreAdminAdapter(() => adminDb)
    : createFirestoreAdapter(() => clientDb);

  const entriesProvider = createFirebaseEntriesProvider(adapter);

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(adapter),
    entries: entriesProvider,
    voters: createFirebaseVotersProvider(adapter),
    scores: createFirebaseScoresProvider(adapter),
    configs: createFirebaseConfigsProvider(adapter),

    async initialize() {
      if (isServer) {
        if (!isFirebaseAdminConfigured()) {
          console.warn('[FirebaseBackend] Admin SDK not configured on server; backend will be unavailable.');
          return success(undefined);
        }
        adminDb = getFirebaseAdminFirestore();
        if (!adminDb) {
          console.warn('[FirebaseBackend] Admin SDK failed to initialize.');
          return success(undefined);
        }
        console.log('[FirebaseBackend] Initialized (server, Admin SDK)');
        return success(undefined);
      }

      const firebase = initializeFirebase();
      clientDb = firebase.db;

      if (!isFirebaseConfigured() || !clientDb) {
        console.warn('[FirebaseBackend] Firebase not configured or unavailable; using local-only mode.');
        return success(undefined);
      }

      try {
        await seedDefaultConfigs(adapter);
      } catch (err) {
        console.error('[FirebaseBackend] Failed to seed default configs:', err);
      }

      console.log('[FirebaseBackend] Initialized (client)');
      return success(undefined);
    },

    async dispose() {
      clientDb = null;
      adminDb = null;
    },
  };
}
