'use client';

/**
 * React hooks for accessing mixology backend data.
 *
 * These hooks provide a clean interface for components to fetch and
 * mutate data without knowing about the underlying backend provider.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Contest, Drink, Judge, ScoreEntry, ProviderResult } from '../backend';
import { extractCurrentContest } from '../data/api';

/**
 * Generic async state shape
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching contests list
 */
export function useContests() {
  const [state, setState] = useState<AsyncState<Contest[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/mixology/contests');
      const json = await res.json();
      setState({ data: json.contests ?? [], loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook for fetching a single contest by slug
 */
export function useContest(slug: string | null) {
  const [state, setState] = useState<AsyncState<Contest>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!slug) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/mixology/contests?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setState({ data: null, loading: false, error: 'Contest not found' });
        return;
      }
      const json = await res.json();
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook for fetching the default/current contest
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
      const res = await fetch('/api/mixology/contests');
      const json = await res.json();
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

/**
 * Helper type for mutation functions
 */
export interface MutationState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook for contest mutations (create, update, delete)
 */
export function useContestMutations() {
  const [state, setState] = useState<MutationState>({ loading: false, error: null });

  const createContest = useCallback(
    async (data: Omit<Contest, 'id' | 'drinks' | 'judges' | 'scores'>): Promise<ProviderResult<Contest>> => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch('/api/mixology/contests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        setState({ loading: false, error: null });
        return { success: res.ok, data: json, error: res.ok ? undefined : json.message };
      } catch (err) {
        const errMsg = String(err);
        setState({ loading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    },
    []
  );

  const updateContest = useCallback(
    async (id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`/api/mixology/contests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        setState({ loading: false, error: null });
        return { success: res.ok, data: json, error: res.ok ? undefined : json.message };
      } catch (err) {
        const errMsg = String(err);
        setState({ loading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    },
    []
  );

  const deleteContest = useCallback(async (id: string): Promise<ProviderResult<void>> => {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/mixology/contests/${id}`, {
        method: 'DELETE',
      });
      setState({ loading: false, error: null });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.message };
      }
      return { success: true };
    } catch (err) {
      const errMsg = String(err);
      setState({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  }, []);

  return { ...state, createContest, updateContest, deleteContest };
}
