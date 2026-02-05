/**
 * Firebase judges provider.
 *
 * Handles CRUD operations for judges stored as arrays in contest documents.
 */

import type { JudgesProvider, Judge } from '../../helpers/types';
import { createArrayEntityOperations } from '../arrayEntityAdapter';
import type { FirestoreAdapter } from '../firestoreAdapter';

/**
 * Creates the Firebase judges provider.
 */
export function createFirebaseJudgesProvider(adapter: FirestoreAdapter): JudgesProvider {
  const operations = createArrayEntityOperations<Judge>({
    adapter,
    getArray: (contest) => contest.judges,
    setArray: (judges) => ({ judges }),
    entityName: 'Judge',
    idPrefix: 'judge',
  });

  return {
    listByContest: operations.list,
    getById: operations.getById,
    create: operations.create,
    update: operations.update,
    delete: operations.delete,
  };
}
