/**
 * Firebase contests provider.
 *
 * Handles CRUD operations for contest documents in Firestore.
 */

import type { ContestsProvider, Contest, ProviderResult } from '../../helpers/types';
import { generateId, withDb } from '../../helpers/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { getTemplate, getDefaultConfig } from '../../helpers/contestTemplates';

/** Input shape from the API when creating a contest */
interface ContestCreateInput {
  name: string;
  slug: string;
  configTemplate?: string;
  config?: Contest['config'];
  entryLabel?: string;
  entryLabelPlural?: string;
}

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
        const typedInput = input as ContestCreateInput;

        // Resolve config from template or use provided config
        let resolvedConfig = typedInput.config;
        if (!resolvedConfig && typedInput.configTemplate) {
          resolvedConfig = getTemplate(typedInput.configTemplate);
        }
        if (!resolvedConfig) {
          resolvedConfig = getDefaultConfig();
        }

        // Apply entry label overrides if provided
        if (typedInput.entryLabel || typedInput.entryLabelPlural) {
          resolvedConfig = {
            ...resolvedConfig,
            entryLabel: typedInput.entryLabel || resolvedConfig.entryLabel,
            entryLabelPlural: typedInput.entryLabelPlural || resolvedConfig.entryLabelPlural,
          };
        }

        const newContest: Contest = {
          id,
          name: typedInput.name,
          slug: typedInput.slug,
          phase: 'set', // Default phase for new contests
          config: resolvedConfig,
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
