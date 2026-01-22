/**
 * Firebase contests provider.
 *
 * Handles CRUD operations for contest documents in Firestore.
 */

import type { ContestsProvider, Contest, ProviderResult } from '../../backend/types';
import { generateId, withDb } from '../../backend/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

/**
 * Creates the Firebase contests provider.
 */
export function createFirebaseContestsProvider(adapter: FirestoreAdapter): ContestsProvider {
  return {
    list(): Promise<ProviderResult<Contest[]>> {
      return withDb(adapter, () => adapter.listContests());
    },

    getBySlug(slug: string): Promise<ProviderResult<Contest | null>> {
      return withDb(adapter, () => adapter.getContestBySlug(slug));
    },

    getDefault(): Promise<ProviderResult<Contest | null>> {
      return withDb(adapter, () => adapter.getDefaultContest());
    },

    create(input): Promise<ProviderResult<Contest>> {
      return withDb(adapter, async () => {
        const id = generateId('contest');
        const newContest: Contest = {
          ...input,
          id,
          entries: [],
          judges: [],
          scores: [],
        };
        await adapter.createContest(id, newContest);
        return newContest;
      });
    },

    update(id, updates): Promise<ProviderResult<Contest>> {
      return withDb(adapter, async () => {
        const existing = await adapter.getContest(id);
        if (!existing) throw new Error('Contest not found');

        await adapter.updateContest(id, updates);
        const updated = await adapter.getContest(id);
        return updated!;
      });
    },

    delete(id): Promise<ProviderResult<void>> {
      return withDb(adapter, () => adapter.deleteContest(id));
    },

    setDefault(id): Promise<ProviderResult<Contest>> {
      return withDb(adapter, async () => {
        // Unset all current defaults
        const allContests = await adapter.listContests();
        for (const contest of allContests) {
          if (contest.defaultContest) {
            await adapter.updateContest(contest.id, { defaultContest: false });
          }
        }

        // Set the new default
        await adapter.updateContest(id, { defaultContest: true });
        const updated = await adapter.getContest(id);
        return updated!;
      });
    },
  };
}
