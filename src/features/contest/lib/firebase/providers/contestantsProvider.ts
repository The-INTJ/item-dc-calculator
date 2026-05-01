/**
 * Firebase contestants provider.
 *
 * Contestants live as an inline array on the contest document. Behaves
 * identically to voters/entries — array CRUD via the shared array-entity
 * adapter.
 */

import type { Contestant, ContestantsProvider } from '../../backend/types';
import { createArrayEntityOperations } from '../arrayEntityAdapter';
import type { FirestoreAdapter } from '../firestoreAdapter';

export function createFirebaseContestantsProvider(adapter: FirestoreAdapter): ContestantsProvider {
  const operations = createArrayEntityOperations<Contestant>({
    adapter,
    getArray: (contest) => (contest as unknown as { contestants?: Contestant[] }).contestants ?? [],
    setArray: (contestants) => ({ contestants } as Record<string, unknown>),
    entityName: 'Contestant',
    idPrefix: 'contestant',
  });

  return {
    listByContest: operations.list,
    getById: operations.getById,
    create: operations.create,
    update: operations.update,
    delete: operations.delete,
  };
}
