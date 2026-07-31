import type {
  CollectionReference,
  DocumentReference,
  Firestore as AdminFirestore,
} from 'firebase-admin/firestore';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION } from '../collection-names';

/**
 * Where matchup docs live. The Admin SDK addresses subcollections by chaining,
 * so without this the same four-link path is spelled out in every read and
 * write — and a typo in one of them is a silent miss, not a type error.
 */
export function matchupsCollection(db: AdminFirestore, contestId: string): CollectionReference {
  return db.collection(CONTESTS_COLLECTION).doc(contestId).collection(MATCHUPS_SUBCOLLECTION);
}

export function matchupRef(
  db: AdminFirestore,
  contestId: string,
  matchupId: string,
): DocumentReference {
  return matchupsCollection(db, contestId).doc(matchupId);
}
