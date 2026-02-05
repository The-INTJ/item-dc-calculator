/**
 * Voting hook - saves votes to Firestore.
 */

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase, isFirebaseConfigured } from '../../../lib/firebase/config';
import type { Vote, VoteInput, VotingActions } from '../contestTypes';

const VOTES_COLLECTION = 'mixology_votes';

export function useVoting(userId: string | null): VotingActions {
  async function recordVote(input: VoteInput): Promise<void> {
    if (!userId || !isFirebaseConfigured()) return;

    const { db } = initializeFirebase();
    if (!db) return;

    const vote: Vote = { ...input, timestamp: Date.now() };

    // Check for existing vote
    const votesQuery = query(
      collection(db, VOTES_COLLECTION),
      where('userId', '==', userId),
      where('contestId', '==', vote.contestId),
      where('entryId', '==', vote.entryId)
    );
    const existing = await getDocs(votesQuery);

    if (!existing.empty) {
      const voteDoc = existing.docs[0];
      await updateDoc(doc(db, VOTES_COLLECTION, voteDoc.id), {
        score: vote.score,
        breakdown: vote.breakdown,
        naSections: vote.naSections,
        notes: vote.notes,
        timestamp: vote.timestamp,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, VOTES_COLLECTION), {
        userId,
        ...vote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return { recordVote };
}
