import { doc, serverTimestamp, type Firestore, type Transaction } from 'firebase/firestore';
import type { Entry } from '../../../contexts/contest/contestTypes';
import { CONTESTS_COLLECTION, MATCHUPS_SUBCOLLECTION } from '../collection-names';

/**
 * Each matchup entry carries a running `sumScore`/`voteCount` so a leaderboard
 * reads one matchup doc instead of every vote under it. Editing or deleting a
 * vote therefore has to move those running numbers inside the same transaction
 * that touches the vote. A missing matchup or entry is a no-op, not an error:
 * the vote record is still the source of truth.
 */
export async function adjustMatchupEntryTally(
  db: Firestore,
  transaction: Transaction,
  target: { contestId: string; matchupId: string; entryId: string },
  apply: (entry: Entry) => void,
): Promise<void> {
  const matchupRef = doc(
    db,
    CONTESTS_COLLECTION,
    target.contestId,
    MATCHUPS_SUBCOLLECTION,
    target.matchupId,
  );
  const matchupSnap = await transaction.get(matchupRef);
  if (!matchupSnap.exists()) return;

  const entries = ((matchupSnap.data().entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
  const entryIndex = entries.findIndex((e) => e.id === target.entryId);
  if (entryIndex === -1) return;

  apply(entries[entryIndex]);
  transaction.update(matchupRef, { entries, updatedAt: serverTimestamp() });
}
