import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { normalizeContest } from '../../domain/normalizeContest';
import { planContestantRemoval } from '../../domain/contestantRemoval';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from '../firestoreAdapter';

type ContestantCascadeMethods = Pick<FirestoreAdapter, 'removeContestantCascade'>;

// ---- Contestant cascade ----

export function contestantCascadeMethods(requireDb: () => AdminFirestore): ContestantCascadeMethods {
  return {
    async removeContestantCascade(contestId, contestantId): Promise<void> {
      const db = requireDb();
      const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
      const contestSnap = await contestRef.get();
      if (!contestSnap.exists) throw new Error('Contest not found');
      const contest = normalizeContest(contestSnap.id, contestSnap.data() as Record<string, unknown>);
      if (!(contest.contestants ?? []).some((c) => c.id === contestantId)) {
        throw new Error('Contestant not found');
      }

      const matchupsSnap = await contestRef.collection(MATCHUPS_SUBCOLLECTION).get();
      const matchups = matchupsSnap.docs.map((d) =>
        normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>),
      );
      const plan = planContestantRemoval(contestantId, matchups);

      const batch = db.batch();
      for (const entryId of plan.purgedEntryIds) {
        const votes = await contestRef
          .collection(VOTES_SUBCOLLECTION)
          .where('entryId', '==', entryId)
          .get();
        for (const voteDoc of votes.docs) batch.delete(voteDoc.ref);
      }
      for (const update of plan.updates) {
        batch.update(contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(update.matchupId), {
          entries: update.entries,
          phase: update.phase,
          winnerEntryId: update.winnerEntryId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      for (const matchupId of plan.deletes) {
        batch.delete(contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId));
      }
      batch.update(contestRef, {
        contestants: (contest.contestants ?? []).filter((c) => c.id !== contestantId),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },
  };
}
