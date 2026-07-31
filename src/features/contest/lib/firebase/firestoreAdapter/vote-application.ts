import {
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase/firestore';
import type { Entry, ScoreBreakdown } from '../../../contexts/contest/contestTypes';
import { computeVoteTotal } from '../scoreHelpers';

/**
 * Matchup entries copied for mutation, once the matchup is confirmed to exist
 * and be open for scoring. Scoring a matchup outside the shake phase is a
 * caller error, not a silent no-op.
 */
export function openMatchupEntries(matchupSnap: DocumentSnapshot<DocumentData>): Entry[] {
  if (!matchupSnap.exists()) throw new Error('Matchup not found');
  const matchupData = matchupSnap.data() as Record<string, unknown>;
  if (matchupData.phase !== 'shake') throw new Error('Matchup is not open for scoring');
  return ((matchupData.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
}

/**
 * Write one vote doc and move the matchup entry's running tally by the same
 * amount. Re-voting replaces a previous breakdown, so the delta is measured
 * against it and the vote count only rises for a genuinely new vote.
 *
 * The entry is mutated in place — it belongs to the copied array the caller
 * writes back to the matchup once every score in the ballot is applied.
 */
export function writeVoteAndTally(
  transaction: Transaction,
  voteRef: DocumentReference,
  voteSnap: DocumentSnapshot<DocumentData>,
  entry: Entry,
  vote: { userId: string; entryId: string; matchupId: string; breakdown: ScoreBreakdown },
): void {
  const isNewVote = !voteSnap.exists();
  const newTotal = computeVoteTotal(vote.breakdown);
  const delta = isNewVote
    ? newTotal
    : newTotal - computeVoteTotal((voteSnap.data()?.breakdown ?? {}) as ScoreBreakdown);

  const voteData: Record<string, unknown> = { ...vote, updatedAt: serverTimestamp() };
  if (isNewVote) voteData.createdAt = serverTimestamp();
  transaction.set(voteRef, voteData, { merge: true });

  entry.sumScore = (entry.sumScore ?? 0) + delta;
  entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);
}

/** Locate the entry a vote targets, rejecting scores aimed outside the matchup. */
export function requireEntry(entries: Entry[], entryId: string): Entry {
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) throw new Error('Entry is not part of this matchup');
  return entry;
}
