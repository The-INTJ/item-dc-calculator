'use client';

import { useEffect, useState } from 'react';

import { subscribeToGame } from '../lib/realtime/subscriptions';
import type { TracerGame } from '../lib/types';

export type LiveStatus = 'connecting' | 'live' | 'error';

/**
 * The game, starting from the server-rendered copy and then following the
 * live document. `live` says whether updates are actually flowing.
 */
export function useTracerGame(gameId: string, initialGame: TracerGame) {
  const [game, setGame] = useState(initialGame);
  const [live, setLive] = useState<LiveStatus>('connecting');
  const [missing, setMissing] = useState(false);

  useEffect(
    () =>
      subscribeToGame(
        gameId,
        (next) => {
          if (!next) {
            setMissing(true);
            return;
          }
          setGame(next);
          setMissing(false);
          setLive('live');
        },
        () => setLive('error'),
      ),
    [gameId],
  );

  return { game, live, missing };
}
