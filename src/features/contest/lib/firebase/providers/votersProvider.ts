/**
 * Firebase voters provider.
 *
 * Handles CRUD operations for voters stored as arrays in contest documents.
 */

import type { VotersProvider, Voter } from '../../helpers/types';
import { createArrayEntityOperations } from '../arrayEntityAdapter';
import type { FirestoreAdapter } from '../firestoreAdapter';

/**
 * Creates the Firebase voters provider.
 */
export function createFirebaseVotersProvider(adapter: FirestoreAdapter): VotersProvider {
  const operations = createArrayEntityOperations<Voter>({
    adapter,
    getArray: (contest) => contest.voters ?? [],
    setArray: (voters) => ({ voters }),
    entityName: 'Voter',
    idPrefix: 'voter',
  });

  return {
    listByContest: operations.list,
    getById: operations.getById,
    create: operations.create,
    update: operations.update,
    delete: operations.delete,
  };
}
