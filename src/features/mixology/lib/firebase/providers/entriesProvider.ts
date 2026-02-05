/**
 * Firebase entries provider.
 *
 * Handles CRUD operations for entries stored as arrays in contest documents.
 */

import type { EntriesProvider, Entry } from '../../helpers/types';
import { createArrayEntityOperations } from '../arrayEntityAdapter';
import type { FirestoreAdapter } from '../firestoreAdapter';

/**
 * Creates the Firebase entries provider.
 */
export function createFirebaseEntriesProvider(adapter: FirestoreAdapter): EntriesProvider {
  const operations = createArrayEntityOperations<Entry>({
    adapter,
    getArray: (contest) => contest.entries,
    setArray: (entries) => ({ entries }),
    entityName: 'Entry',
    idPrefix: 'entry',
  });

  return {
    listByContest: operations.list,
    getById: operations.getById,
    create: operations.create,
    update: operations.update,
    delete: operations.delete,
  };
}
