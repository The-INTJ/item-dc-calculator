/**
 * Firestore adapter — SDK-agnostic interface for all Firestore operations.
 *
 * Two implementations exist:
 *  - this module (client SDK, used in the browser for realtime-compatible flows)
 *  - ../firestoreAdminAdapter (Admin SDK, used in API routes on the server)
 *
 * Sub-providers must only call adapter methods — never import `firebase/firestore`
 * or `firebase-admin/firestore` directly. This keeps the server/client swap in
 * firebaseBackendProvider.ts as the single branch point.
 */

import type { Firestore } from 'firebase/firestore';
import type { FirestoreAdapter } from './adapter-contract';
import { configMethods } from './configs';
import { contestMethods } from './contests';
import { contestantCascadeMethods } from './contestant-cascade';
import { matchupMethods } from './matchups';
import { profileMethods } from './profiles';
import { scoreRecordMethods } from './scores';
import { voteSubmissionMethods } from './vote-submission';

export type { FirestoreAdapter } from './adapter-contract';
export { buildInlineEntriesFromContestantIds, prepareNewMatchup } from './matchup-entries';

/**
 * Creates a Firestore adapter backed by the client SDK.
 */
export function createFirestoreAdapter(getDb: () => Firestore | null): FirestoreAdapter {
  function requireDb(): Firestore {
    const db = getDb();
    if (!db) throw new Error('Firebase not initialized');
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
