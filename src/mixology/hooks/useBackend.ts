'use client';

/**
 * React hooks for accessing mixology backend data.
 *
 * These hooks provide a clean interface for components to fetch and
 * mutate data without knowing about the underlying backend provider.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
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
  const { role, loading: authLoading } = useAuth();
  const isAdmin = role === 'admin';
  const [state, setState] = useState<AsyncState<Contest[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!isAdmin) {
      setState({ data: null, loading: false, error: 'Admin access required' });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/mixology/contests', {
        headers: { 'x-mixology-role': role ?? 'viewer' },
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ data: null, loading: false, error: json.message ?? 'Failed to load contests' });
        return;
      }
      setState({ data: json.contests ?? [], loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, [authLoading, isAdmin, role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook for fetching a single contest by slug
 */
export function useContest(slug: string | null) {
  const { role, loading: authLoading } = useAuth();
  const isAdmin = role === 'admin';
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

    if (authLoading) {
      return;
    }

    if (!isAdmin) {
      setState({ data: null, loading: false, error: 'Admin access required' });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/mixology/contests?slug=${encodeURIComponent(slug)}`, {
        headers: { 'x-mixology-role': role ?? 'viewer' },
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ data: null, loading: false, error: json.message ?? 'Contest not found' });
        return;
      }
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, [authLoading, isAdmin, role, slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook for fetching the default/current contest
 */
export function useCurrentContest() {
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<AsyncState<Contest>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (authLoading) {
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/mixology/current');
      const json = await res.json();
      if (!res.ok) {
        setState({ data: null, loading: false, error: json.message ?? 'Failed to load contests' });
        return;
      }
      setState({ data: extractCurrentContest(json), loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) });
    }
  }, [authLoading]);

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
  const { role, loading: authLoading } = useAuth();
  const isAdmin = role === 'admin';
  const [state, setState] = useState<MutationState>({ loading: false, error: null });

  const createContest = useCallback(
    async (data: Omit<Contest, 'id' | 'drinks' | 'judges' | 'scores'>): Promise<ProviderResult<Contest>> => {
      if (authLoading || !isAdmin) {
        const error = 'Admin access required';
        setState({ loading: false, error });
        return { success: false, error };
      }
      setState({ loading: true, error: null });
      try {
        const res = await fetch('/api/mixology/contests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-mixology-role': role ?? 'viewer' },
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
    [authLoading, isAdmin, role]
  );

  const updateContest = useCallback(
    async (id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> => {
      if (authLoading || !isAdmin) {
        const error = 'Admin access required';
        setState({ loading: false, error });
        return { success: false, error };
      }
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`/api/mixology/contests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-mixology-role': role ?? 'viewer' },
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
    [authLoading, isAdmin, role]
  );

  const deleteContest = useCallback(async (id: string): Promise<ProviderResult<void>> => {
    if (authLoading || !isAdmin) {
      const error = 'Admin access required';
      setState({ loading: false, error });
      return { success: false, error };
    }
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/mixology/contests/${id}`, {
        method: 'DELETE',
        headers: { 'x-mixology-role': role ?? 'viewer' },
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
  }, [authLoading, isAdmin, role]);

  return { ...state, createContest, updateContest, deleteContest };
}
