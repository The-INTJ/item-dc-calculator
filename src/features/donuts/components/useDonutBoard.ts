'use client';

import { useCallback, useEffect, useState } from 'react';

import { donutsApi } from '../lib/api/donutsApi';
import type { DonutBoard, ProviderResult } from '../lib/types';

/**
 * Loads the board and keeps it in sync. Every mutation endpoint answers with
 * the whole updated board, so `apply` is the only way state changes here — the
 * UI never patches a local copy and never drifts from the server.
 */
export function useDonutBoard() {
  const [board, setBoard] = useState<DonutBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    donutsApi.load().then((result) => {
      if (!active) {
        return;
      }
      if (result.success && result.data) {
        setBoard(result.data);
        setError(null);
      } else {
        setError(result.error ?? 'Could not load the donut rotation.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  /** Fold a mutation response into state; returns an error message on failure. */
  const apply = useCallback((result: ProviderResult<DonutBoard>): string | null => {
    if (result.success && result.data) {
      setBoard(result.data);
      return null;
    }
    return result.error ?? 'That did not work. Try again.';
  }, []);

  return { board, loading, error, reload, apply };
}
