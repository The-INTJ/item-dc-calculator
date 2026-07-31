import type { Firestore } from 'firebase/firestore';
import type { FirestoreAdapter } from './adapter-contract';
import { scoreQueryMethods } from './score-queries';
import { scoreMutationMethods } from './score-mutations';

type ScoreRecordMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore' | 'updateScore' | 'deleteScore'
>;

// ---- Scores / votes ----

export function scoreRecordMethods(
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): ScoreRecordMethods {
  return {
    ...scoreQueryMethods(getDb),
    ...scoreMutationMethods(requireDb),
  };
}
