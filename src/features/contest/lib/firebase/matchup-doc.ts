/**
 * Maps a raw Firestore matchup document to the app-level Matchup shape.
 * Shared by the client-SDK adapter (firestoreAdapter/) and the Admin-SDK
 * adapter (firestoreAdminAdapter/).
 */

import type { Entry, Matchup } from '../../contexts/contest/contestTypes';

export function normalizeMatchupDoc(contestId: string, id: string, data: Record<string, unknown>): Matchup {
  const { createdAt: _c, updatedAt: _u, ...rest } = data;
  return {
    ...rest,
    id,
    contestId,
    entries: ((rest.entries as Entry[] | undefined) ?? []) as Entry[],
  } as Matchup;
}
