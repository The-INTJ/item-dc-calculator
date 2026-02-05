/**
 * Generic adapter for array-backed entities stored within contest documents.
 *
 * Entries, Judges, and Scores are stored as arrays within the contest document.
 * This adapter provides reusable CRUD operations for any such entity type.
 */

import type { Contest, ProviderResult } from '../helpers/types';
import { generateId, success, error } from '../helpers/providerUtils';
import type { FirestoreAdapter } from './firestoreAdapter';

/**
 * Configuration for creating an array entity provider.
 */
export interface ArrayEntityConfig<T extends { id: string }> {
  /** The Firestore adapter instance. */
  adapter: FirestoreAdapter;

  /** Extracts the entity array from a contest. */
  getArray: (contest: Contest) => T[];

  /** Returns partial contest updates with the new entity array. */
  setArray: (items: T[]) => Partial<Contest>;

  /** Human-readable entity name for error messages. */
  entityName: string;

  /** ID prefix for new entities (e.g., 'entry', 'judge'). */
  idPrefix: string;
}

/**
 * Standard CRUD operations for array-backed entities.
 */
export interface ArrayEntityOperations<T extends { id: string }> {
  list(contestId: string): Promise<ProviderResult<T[]>>;
  getById(contestId: string, entityId: string): Promise<ProviderResult<T | null>>;
  create(contestId: string, input: Omit<T, 'id'> & { id?: string }): Promise<ProviderResult<T>>;
  update(contestId: string, entityId: string, updates: Partial<T>): Promise<ProviderResult<T>>;
  delete(contestId: string, entityId: string): Promise<ProviderResult<void>>;
}

/**
 * Creates CRUD operations for an array-backed entity type.
 */
export function createArrayEntityOperations<T extends { id: string }>(
  config: ArrayEntityConfig<T>
): ArrayEntityOperations<T> {
  const { adapter, getArray, setArray, entityName, idPrefix } = config;

  return {
    async list(contestId: string): Promise<ProviderResult<T[]>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');
      return success(getArray(contest));
    },

    async getById(contestId: string, entityId: string): Promise<ProviderResult<T | null>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');
      const item = getArray(contest).find((e) => e.id === entityId);
      return success(item ?? null);
    },

    async create(contestId: string, input: Omit<T, 'id'> & { id?: string }): Promise<ProviderResult<T>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');

      const newItem = { ...input, id: input.id ?? generateId(idPrefix) } as T;
      const newArray = [...getArray(contest), newItem];

      await adapter.updateContest(contestId, setArray(newArray));
      return success(newItem);
    },

    async update(contestId: string, entityId: string, updates: Partial<T>): Promise<ProviderResult<T>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');

      const array = getArray(contest);
      const idx = array.findIndex((e) => e.id === entityId);
      if (idx === -1) return error(`${entityName} not found`);

      const updatedItem = { ...array[idx], ...updates };
      const newArray = [...array];
      newArray[idx] = updatedItem;

      await adapter.updateContest(contestId, setArray(newArray));
      return success(updatedItem);
    },

    async delete(contestId: string, entityId: string): Promise<ProviderResult<void>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');

      const newArray = getArray(contest).filter((e) => e.id !== entityId);
      await adapter.updateContest(contestId, setArray(newArray));
      return success(undefined);
    },
  };
}
