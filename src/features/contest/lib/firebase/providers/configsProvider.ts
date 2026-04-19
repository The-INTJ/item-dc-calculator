/**
 * Firebase configs provider.
 *
 * Handles CRUD operations for contest configuration documents in Firestore.
 */

import type { ConfigsProvider, ContestConfigItem, ProviderResult } from '../../backend/types';
import { generateId, withDb } from '../../backend/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

export function createFirebaseConfigsProvider(adapter: FirestoreAdapter): ConfigsProvider {
  return {
    async list(): Promise<ProviderResult<ContestConfigItem[]>> {
      return withDb(adapter, () => adapter.listConfigs());
    },

    async getById(configId: string): Promise<ProviderResult<ContestConfigItem | null>> {
      return withDb(adapter, () => adapter.getConfig(configId));
    },

    async create(config: Omit<ContestConfigItem, 'id'> & { id?: string }): Promise<ProviderResult<ContestConfigItem>> {
      return withDb(adapter, async () => {
        if (!config.topic || !config.attributes || config.attributes.length === 0) {
          throw new Error('Config must have a topic and at least one attribute');
        }

        const id = config.id || generateId('config');
        const newConfig: ContestConfigItem = {
          id,
          topic: config.topic,
          attributes: config.attributes,
          entryLabel: config.entryLabel,
          entryLabelPlural: config.entryLabelPlural,
        };

        await adapter.createConfig(id, {
          topic: newConfig.topic,
          attributes: newConfig.attributes,
          entryLabel: newConfig.entryLabel,
          entryLabelPlural: newConfig.entryLabelPlural,
        });

        return newConfig;
      });
    },

    async update(configId: string, updates: Partial<ContestConfigItem>): Promise<ProviderResult<ContestConfigItem>> {
      return withDb(adapter, () => adapter.updateConfig(configId, updates));
    },

    async delete(configId: string): Promise<ProviderResult<void>> {
      return withDb(adapter, () => adapter.deleteConfig(configId));
    },
  };
}
