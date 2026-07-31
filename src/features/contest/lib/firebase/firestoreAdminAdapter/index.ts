/**
 * Firestore adapter backed by firebase-admin. Used in API routes on the server.
 *
 * Mirrors the client-SDK adapter in ../firestoreAdapter, but uses Admin SDK
 * APIs (db.collection().doc(), FieldValue.serverTimestamp(), etc.).
 * The Admin SDK bypasses Firestore security rules by design, which is what
 * lets API routes read/write even though the rules require `signedIn()`
 * for direct client access.
 */

import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { configMethods } from './configs';
import { contestMethods } from './contests';
import { contestantCascadeMethods } from './contestant-cascade';
import { matchupMethods } from './matchups';
import { profileMethods } from './profiles';
import { scoreRecordMethods } from './scores';
import { voteSubmissionMethods } from './vote-submission';

export function createFirestoreAdminAdapter(getDb: () => AdminFirestore | null): FirestoreAdapter {
  function requireDb(): AdminFirestore {
    const db = getDb();
    if (!db) throw new Error('Firebase Admin not initialized');
    return db;
  }

  return {
    isReady(): boolean {
      return getDb() !== null;
    },
    ...contestMethods(getDb, requireDb),
    ...configMethods(getDb, requireDb),
    ...scoreRecordMethods(getDb, requireDb),
    ...voteSubmissionMethods(requireDb),
    ...contestantCascadeMethods(requireDb),
    ...matchupMethods(getDb, requireDb),
    ...profileMethods(getDb, requireDb),
  };
}
