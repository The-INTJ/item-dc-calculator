import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { ScoreEntry } from '../../../contexts/contest/contestTypes';
import type { BallotInput } from '../../backend/types';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { docToScoreEntry, makeVoteDocId } from '../scoreHelpers';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { openMatchupEntries, requireEntry, writeVoteAndTally } from './vote-application';

type VoteSubmissionMethods = Pick<FirestoreAdapter, 'submitScore' | 'submitBallot'>;

export function voteSubmissionMethods(requireDb: () => AdminFirestore): VoteSubmissionMethods {
  return {
    async submitScore(contestId, input): Promise<ScoreEntry> {
      const db = requireDb();
      const { userId, entryId, matchupId } = input;
      if (!matchupId) throw new Error('matchupId is required');
      const voteDocId = makeVoteDocId(userId, matchupId, entryId);

      return db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(voteDocId);

        const [matchupSnap, voteSnap] = await Promise.all([
          transaction.get(matchupRef),
          transaction.get(voteRef),
        ]);

        const entries = openMatchupEntries(matchupSnap);
        const entry = requireEntry(entries, entryId);
        const vote = { userId, entryId, matchupId, breakdown: input.breakdown };

        writeVoteAndTally(transaction, voteRef, voteSnap, entry, vote);
        transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });

        return docToScoreEntry(voteDocId, vote);
      });
    },

    async submitBallot(contestId, input: BallotInput): Promise<ScoreEntry[]> {
      const db = requireDb();
      const { userId, matchupId, scores } = input;
      if (!matchupId) throw new Error('matchupId is required');
      if (scores.length === 0) throw new Error('Ballot must contain at least one score');

      return db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
        const voteRefs = scores.map((s) =>
          contestRef.collection(VOTES_SUBCOLLECTION).doc(makeVoteDocId(userId, matchupId, s.entryId)),
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

        transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
        return results;
      });
    },
  };
}
