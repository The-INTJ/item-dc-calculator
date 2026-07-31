import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Entry, ScoreBreakdown, ScoreEntry } from '../../../contexts/contest/contestTypes';
import type { BallotInput } from '../../backend/types';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { computeVoteTotal, docToScoreEntry, makeVoteDocId } from '../scoreHelpers';
import type { FirestoreAdapter } from '../firestoreAdapter';

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

        if (!matchupSnap.exists) throw new Error('Matchup not found');

        const matchupData = matchupSnap.data() as Record<string, unknown>;
        if (matchupData.phase !== 'shake') throw new Error('Matchup is not open for scoring');
        const entries = ((matchupData.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
        const entryIndex = entries.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) throw new Error('Entry is not part of this matchup');

        const newTotal = computeVoteTotal(input.breakdown);
        let delta: number;
        let isNewVote: boolean;

        if (voteSnap.exists) {
          const oldBreakdown = ((voteSnap.data() as Record<string, unknown>).breakdown ?? {}) as ScoreBreakdown;
          delta = newTotal - computeVoteTotal(oldBreakdown);
          isNewVote = false;
        } else {
          delta = newTotal;
          isNewVote = true;
        }

        const voteData: Record<string, unknown> = {
          userId,
          entryId,
          matchupId,
          breakdown: input.breakdown,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (isNewVote) voteData.createdAt = FieldValue.serverTimestamp();
        transaction.set(voteRef, voteData, { merge: true });

        const entry = entries[entryIndex];
        entry.sumScore = (entry.sumScore ?? 0) + delta;
        entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);

        transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });

        return docToScoreEntry(voteDocId, {
          userId,
          entryId,
          matchupId,
          breakdown: input.breakdown,
        });
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

        if (!matchupSnap.exists) throw new Error('Matchup not found');
        const matchupData = matchupSnap.data() as Record<string, unknown>;
        if (matchupData.phase !== 'shake') throw new Error('Matchup is not open for scoring');
        const entries = ((matchupData.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));

        const results: ScoreEntry[] = [];
        for (let i = 0; i < scores.length; i += 1) {
          const { entryId, breakdown } = scores[i];
          const entryIndex = entries.findIndex((e) => e.id === entryId);
          if (entryIndex === -1) throw new Error('Entry is not part of this matchup');

          const voteSnap = voteSnaps[i];
          const newTotal = computeVoteTotal(breakdown);
          const isNewVote = !voteSnap.exists;
          const delta = isNewVote
            ? newTotal
            : newTotal -
              computeVoteTotal(
                ((voteSnap.data() as Record<string, unknown>)?.breakdown ?? {}) as ScoreBreakdown,
              );

          const voteData: Record<string, unknown> = {
            userId,
            entryId,
            matchupId,
            breakdown,
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (isNewVote) voteData.createdAt = FieldValue.serverTimestamp();
          transaction.set(voteRefs[i], voteData, { merge: true });

          entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) + delta;
          entries[entryIndex].voteCount = (entries[entryIndex].voteCount ?? 0) + (isNewVote ? 1 : 0);
          results.push(docToScoreEntry(voteRefs[i].id, { userId, entryId, matchupId, breakdown }));
        }

        transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
        return results;
      });
    },
  };
}
