'use client';

import { useState } from 'react';

import type { Side } from '../engine';
import { errorCopy, tracerApi, type ApiResult } from '../lib/api/tracerApi';
import type { DrawAction } from '../lib/schemas';

/**
 * The game's non-turn commands, with one shared busy flag and error line.
 * Results arrive through the live game document; only failures and the
 * rematch's new id come back here.
 */
export function useGameCommands(gameId: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(call: () => Promise<ApiResult<T>>): Promise<T | null> {
    setBusy(true);
    setError(null);
    const result = await call();
    setBusy(false);
    if (result.ok) return result.data;
    setError(errorCopy(result));
    return null;
  }

  return {
    busy,
    error,
    clearError: () => setError(null),
    reportError: (message: string) => setError(message),
    join: (name: string) => run(() => tracerApi.join(gameId, name)),
    resign: () => run(() => tracerApi.resign(gameId)),
    draw: (action: DrawAction) => run(() => tracerApi.draw(gameId, action)),
    rematch: () => run(() => tracerApi.rematch(gameId)),
    releaseSeat: (side: Side) => run(() => tracerApi.releaseSeat(gameId, side)),
  };
}
