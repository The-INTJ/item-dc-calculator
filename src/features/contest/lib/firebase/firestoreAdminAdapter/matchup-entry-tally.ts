import {
  FieldValue,
  type DocumentReference,
  type Transaction,
} from 'firebase-admin/firestore';
import type { Entry } from '../../../contexts/contest/contestTypes';
import { MATCHUPS_SUBCOLLECTION } from '../collection-names';

/**
 * Each matchup entry carries a running `sumScore`/`voteCount` so a leaderboard
 * reads one matchup doc instead of every vote under it. Editing or deleting a
 * vote therefore has to move those running numbers inside the same transaction
 * that touches the vote. A missing matchup or entry is a no-op, not an error:
 * the vote record is still the source of truth.
 */
export async function adjustMatchupEntryTally(
  transaction: Transaction,
  contestRef: DocumentReference,
  target: { matchupId: string; entryId: string },
  apply: (entry: Entry) => void,
): Promise<void> {
  const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(target.matchupId);
  const matchupSnap = await transaction.get(matchupRef);
  if (!matchupSnap.exists) return;

  const entries = (((matchupSnap.data() as Record<string, unknown>).entries as Entry[] | undefined) ?? [])
    .map((e) => ({ ...e }));
  const entryIndex = entries.findIndex((e) => e.id === target.entryId);
  if (entryIndex === -1) return;

  apply(entries[entryIndex]);
  transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
}
