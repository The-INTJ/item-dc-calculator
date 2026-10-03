'use client';

import { useEffect, useState } from 'react';

import { subscribeToTurns } from '../lib/realtime/subscriptions';
import type { StoredTurn } from '../lib/types';

/** The full turn list, subscribed only while something is showing it. */
export function useTurnHistory(gameId: string, enabled: boolean) {
  const [turns, setTurns] = useState<StoredTurn[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeToTurns(
      gameId,
      (next) => {
        setTurns(next);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [gameId, enabled]);

  return { turns, failed };
}
