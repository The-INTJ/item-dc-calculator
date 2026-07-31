import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { ScoreEntry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { docToScoreEntry, makeVoteDocId } from '../scoreHelpers';
import type { FirestoreAdapter } from './adapter-contract';
import { openMatchupEntries, requireEntry, writeVoteAndTally } from './vote-application';

type VoteSubmissionMethods = Pick<FirestoreAdapter, 'submitScore' | 'submitBallot'>;

export function voteSubmissionMethods(requireDb: () => Firestore): VoteSubmissionMethods {
  return {
    async submitScore(contestId, input): Promise<ScoreEntry> {
      const db = requireDb();
      const { userId, entryId, matchupId } = input;
      if (!matchupId) throw new Error('matchupId is required');
      const voteDocId = makeVoteDocId(userId, matchupId, entryId);

      return runTransaction(db, async (transaction) => {
        const matchupRef = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, voteDocId);

        const [matchupSnap, voteSnap] = await Promise.all([
          transaction.get(matchupRef),
          transaction.get(voteRef),
        ]);

        const entries = openMatchupEntries(matchupSnap);
        const entry = requireEntry(entries, entryId);
        const vote = { userId, entryId, matchupId, breakdown: input.breakdown };

        writeVoteAndTally(transaction, voteRef, voteSnap, entry, vote);
        transaction.update(matchupRef, { entries, updatedAt: serverTimestamp() });

        return docToScoreEntry(voteDocId, vote);
      });
    },

    async submitBallot(contestId, input): Promise<ScoreEntry[]> {
      const db = requireDb();
      const { userId, matchupId, scores } = input;
      if (!matchupId) throw new Error('matchupId is required');
      if (scores.length === 0) throw new Error('Ballot must contain at least one score');

      return runTransaction(db, async (transaction) => {
        const matchupRef = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);
        const voteRefs = scores.map((s) =>
          doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, makeVoteDocId(userId, matchupId, s.entryId)),
        );

        const [matchupSnap, ...voteSnaps] = await Promise.all([
          transaction.get(matchupRef),
          ...voteRefs.map((ref) => transaction.get(ref)),
        ]);

        const entries = openMatchupEntries(matchupSnap);
        const results: ScoreEntry[] = [];

        for (let i = 0; i < scores.length; i += 1) {
          const { entryId, breakdown } = scores[i];
          const entry = requireEntry(entries, entryId);
          const vote = { userId, entryId, matchupId, breakdown };

          writeVoteAndTally(transaction, voteRefs[i], voteSnaps[i], entry, vote);
          results.push(docToScoreEntry(voteRefs[i].id, vote));
        }

        transaction.update(matchupRef, { entries, updatedAt: serverTimestamp() });
        return results;
      });
    },
  };
}
