import type { Contest, Voter } from '../../contexts/contest/contestTypes';

/**
 * Coerce a raw Firestore contest document into the Contest shape used by the app.
 *
 * Two responsibilities:
 *  - Drop `createdAt` / `updatedAt` Firestore Timestamps (they're class instances
 *    that break RSC serialization and aren't part of the Contest type).
 *  - Backfill array fields (`contestants`, `voters`) so the UI never has to
 *    defend against `undefined` from older documents that predate the current
 *    schema.
 *
 * Used by the client SDK adapter, the Admin SDK adapter, and the realtime
 * subscription — anything that turns a raw document into a Contest.
 */
export function normalizeContest(id: string, data: Record<string, unknown>): Contest {
  const { createdAt: _c, updatedAt: _u, ...rest } = data;
  return {
    ...rest,
    id,
    contestants: (rest.contestants ?? []) as Contest['contestants'],
    voters: (rest.voters ?? rest.judges ?? []) as Voter[],
  } as Contest;
}
