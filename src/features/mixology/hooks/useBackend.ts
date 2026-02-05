'use client';

/**
 * React hook for fetching current contest data.
 * Provides a simple interface without backend provider coupling.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Contest } from '../types';

/**
 * Generic async state shape
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Extract current contest from API response
 */
function extractCurrentContest(response: unknown): Contest | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  const payload = response as { currentContest?: Contest | null };
  return payload.currentContest ?? null;
}

/**
 * Hook for fetching the default/current contest (public endpoint)
 */
export function useCurrentContest() {
  const [state, setState] = useState<AsyncState<Contest>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/mixology/current');
      const json = await res.json();
      if (!res.ok) {
        setState({ data: null, loading: false, error: json.message ?? 'Failed to load contest' });
        return;
      }
      setState({ data: extractCurrentContest(json), loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
