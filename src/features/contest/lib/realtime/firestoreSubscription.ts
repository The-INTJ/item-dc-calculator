import {
  collection,
  doc,
  onSnapshot,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase/firestore';

/** Default minimum ms between callback invocations. */
const DEFAULT_PACE_MS = 300;

export interface PacedSubscriptionOptions {
  /** Minimum ms between callbacks. Defaults to 300. */
  paceMs?: number;
}

/**
 * Subscribe to a Firestore document with trailing-edge pacing.
 *
 * Rapid snapshots (e.g., concurrent votes updating aggregates) are batched
 * so the callback fires at most once per `paceMs` window. The latest snapshot
 * is always delivered — intermediate ones are dropped.
 *
 * Returns an unsubscribe function that also flushes any pending update.
 */
export function createPacedSubscription<T>(
  db: Firestore,
  path: string,
  docId: string,
  transform: (id: string, data: Record<string, unknown>) => T,
  onData: (data: T) => void,
  options: PacedSubscriptionOptions = {},
): () => void {
  const paceMs = options.paceMs ?? DEFAULT_PACE_MS;
  let pending: T | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const ref: DocumentReference = doc(db, path, docId);

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const transformed = transform(snapshot.id, snapshot.data() as Record<string, unknown>);

      pending = transformed;
      if (!timer) {
        timer = setTimeout(() => {
          if (pending !== null) {
            onData(pending);
            pending = null;
          }
          timer = undefined;
        }, paceMs);
      }
    },
    (error) => console.error(`[RealtimeSubscription] ${path}/${docId}:`, error),
  );

  return () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      if (pending !== null) {
        onData(pending);
        pending = null;
      }
    }
  };
}

/**
 * Subscribe to a Firestore collection (or filtered query) with trailing-edge
 * pacing. Each snapshot is transformed into an array of domain objects and
 * delivered to `onData`.
 *
 * Used for the matchups subcollection so per-matchup phase changes propagate
 * live to all clients without polling.
 *
 * Returns an unsubscribe function that also flushes any pending update.
 */
export function createPacedCollectionSubscription<T>(
  source: Query | ReturnType<typeof collection>,
  transform: (id: string, data: Record<string, unknown>) => T,
  onData: (items: T[]) => void,
  options: PacedSubscriptionOptions = {},
): () => void {
  const paceMs = options.paceMs ?? DEFAULT_PACE_MS;
  let pending: T[] | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = onSnapshot(
    source,
    (snapshot) => {
      const items = snapshot.docs.map((d) => transform(d.id, d.data() as Record<string, unknown>));
      pending = items;
      if (!timer) {
        timer = setTimeout(() => {
          if (pending !== null) {
            onData(pending);
            pending = null;
          }
          timer = undefined;
        }, paceMs);
      }
    },
    (error) => console.error('[RealtimeSubscription] collection error:', error),
  );

  return () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      if (pending !== null) {
        onData(pending);
        pending = null;
      }
    }
  };
}

/**
 * Convenience: subscribe to the `contests/{contestId}/matchups` subcollection
 * and deliver the full list of Matchups on every change.
 */
export function subscribeToMatchups<T>(
  db: Firestore,
  contestId: string,
  transform: (id: string, data: Record<string, unknown>) => T,
  onData: (items: T[]) => void,
  options: PacedSubscriptionOptions = {},
): () => void {
  return createPacedCollectionSubscription(
    collection(db, 'contests', contestId, 'matchups'),
    transform,
    onData,
    options,
  );
}
