/**
 * Firebase profiles provider.
 *
 * Handles CRUD for the `users/{uid}` collection. Writes are only meaningful
 * through the Admin SDK adapter — the client SDK can't set role/privileged
 * fields because Firestore security rules deny direct writes to `users/`.
 */

import type { ProfilesProvider, ProviderResult, SelfProfileUpdates, UserProfile } from '../../backend/types';
import { withDb } from '../../backend/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

export function createFirebaseProfilesProvider(adapter: FirestoreAdapter): ProfilesProvider {
  return {
    async get(uid: string): Promise<ProviderResult<UserProfile | null>> {
      return withDb(adapter, () => adapter.getProfile(uid));
    },

    async upsert(uid: string, profile: UserProfile): Promise<ProviderResult<UserProfile>> {
      return withDb(adapter, () => adapter.upsertProfile(uid, profile));
    },

    async updateSelf(uid: string, updates: SelfProfileUpdates): Promise<ProviderResult<UserProfile>> {
      return withDb(adapter, () => adapter.updateProfile(uid, updates));
    },
  };
}
