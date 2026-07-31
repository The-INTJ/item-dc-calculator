import { type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { scoreQueryMethods } from './score-queries';
import { scoreMutationMethods } from './score-mutations';

type ScoreRecordMethods = Pick<
  FirestoreAdapter,
  'listScoresByEntry' | 'listScoresByUser' | 'getScore' | 'updateScore' | 'deleteScore'
>;

// ---- Scores / votes ----

export function scoreRecordMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): ScoreRecordMethods {
  return {
    ...scoreQueryMethods(getDb),
    ...scoreMutationMethods(requireDb),
  };
}
