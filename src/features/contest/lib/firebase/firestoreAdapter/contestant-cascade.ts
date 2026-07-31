import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { normalizeContest } from '../../domain/normalizeContest';
import { planContestantRemoval } from '../../domain/contestantRemoval';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION, VOTES_SUBCOLLECTION } from '../collection-names';
import { normalizeMatchupDoc } from '../matchup-doc';
import type { FirestoreAdapter } from './adapter-contract';

type ContestantCascadeMethods = Pick<FirestoreAdapter, 'removeContestantCascade'>;

// ---- Contestant cascade ----

export function contestantCascadeMethods(requireDb: () => Firestore): ContestantCascadeMethods {
  return {
    async removeContestantCascade(contestId, contestantId): Promise<void> {
      const db = requireDb();
      const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
      const contestSnap = await getDoc(contestRef);
      if (!contestSnap.exists()) throw new Error('Contest not found');
      const contest = normalizeContest(contestSnap.id, contestSnap.data());
      if (!(contest.contestants ?? []).some((c) => c.id === contestantId)) {
        throw new Error('Contestant not found');
      }

      const matchupsSnap = await getDocs(
        collection(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION),
      );
      const matchups = matchupsSnap.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data()));
      const plan = planContestantRemoval(contestantId, matchups);

      const batch = writeBatch(db);
      for (const entryId of plan.purgedEntryIds) {
        const votes = await getDocs(
          query(
            collection(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION),
            where('entryId', '==', entryId),
          ),
        );
        for (const voteDoc of votes.docs) batch.delete(voteDoc.ref);
      }
      for (const update of plan.updates) {
        batch.update(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, update.matchupId), {
          entries: update.entries,
          phase: update.phase,
          winnerEntryId: update.winnerEntryId,
          updatedAt: serverTimestamp(),
        });
      }
      for (const matchupId of plan.deletes) {
        batch.delete(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId));
      }
      batch.update(contestRef, {
        contestants: (contest.contestants ?? []).filter((c) => c.id !== contestantId),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    },
  };
}
