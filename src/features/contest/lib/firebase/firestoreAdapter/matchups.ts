import type { Firestore } from 'firebase/firestore';
import type { FirestoreAdapter } from './adapter-contract';
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
  getDb: () => Firestore | null,
  requireDb: () => Firestore,
): MatchupMethods {
  return {
    ...matchupQueryMethods(getDb),
    ...matchupWriteMethods(requireDb),
  };
}
