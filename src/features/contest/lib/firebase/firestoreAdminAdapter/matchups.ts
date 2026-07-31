import { type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { matchupQueryMethods } from './matchup-queries';
import { matchupWriteMethods } from './matchup-writes';

type MatchupMethods = Pick<
  FirestoreAdapter,
  | 'listMatchups'
  | 'listMatchupsByRound'
  | 'getMatchup'
  | 'createMatchup'
  | 'updateMatchup'
  | 'deleteMatchup'
  | 'batchCreateMatchups'
  | 'setMatchupEntryName'
>;

// ---- Matchups ----

export function matchupMethods(
  getDb: () => AdminFirestore | null,
  requireDb: () => AdminFirestore,
): MatchupMethods {
  return {
    ...matchupQueryMethods(getDb),
    ...matchupWriteMethods(requireDb),
  };
}
