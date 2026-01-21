'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { buildRoundDetail, buildRoundSummary, buildEntrySummaries } from '../lib/uiMappings';
import type { RoundDetail, RoundSummary, EntrySummary } from '../types/uiTypes';
import type { Contest } from '../types';
import { getCachedContestSnapshot, setCachedContest } from '../services/cache';
import { useAdminContestData } from './AdminContestContext';

interface MixologyDataState {
  contest: Contest | null;
  roundSummary: RoundSummary | null;
  roundDetail: RoundDetail | null;
  drinks: EntrySummary[];
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshRound: (roundId: string) => Promise<void>;
  lastUpdatedAt: number | null;
}

const MixologyDataContext = createContext<MixologyDataState | undefined>(undefined);

interface MixologyDataProviderProps {
  children: React.ReactNode;
}

export function MixologyDataProvider({ children }: MixologyDataProviderProps) {
  const { contests, activeContestId, lastUpdatedAt, refresh: refreshLocal } = useAdminContestData();
  // TODO: Server integration placeholder (disabled for local admin testing).
  // const { data: serverContest, loading: serverLoading, error: serverError, refresh } = useCurrentContest();
  const serverContest: Contest | null = null;
  const serverLoading = false;
  const serverError: string | null = null;
  const refresh = async () => {
    // Intentionally no-op until server endpoints are ready.
  };
  const refreshAllLocal = useCallback(async () => {
    refreshLocal();
  }, [refreshLocal]);
  const contest = serverContest ?? contests.find((item) => item.id === activeContestId) ?? null;
  const loading = serverLoading;
  const error = serverError;
  const lastUpdatedAtRef = useRef<number | null>(null);
  const cachedSnapshot = getCachedContestSnapshot();
  const contestUpdatedEvent = 'mixology:contest-updated';

  useEffect(() => {
    if (!loading) {
      lastUpdatedAtRef.current = Date.now();
    }
  }, [loading, contest]);

  useEffect(() => {
    if (contest) {
      setCachedContest(contest, Date.now());
    }
  }, [contest]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshAllLocal();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshAllLocal]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshAllLocal();
    }, 2 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [refreshAllLocal]);

  useEffect(() => {
    const handleContestUpdated = () => {
      void refreshAllLocal();
    };

    window.addEventListener(contestUpdatedEvent, handleContestUpdated);

    return () => {
      window.removeEventListener(contestUpdatedEvent, handleContestUpdated);
    };
  }, [refreshAllLocal]);

  const value = useMemo<MixologyDataState>(() => {
    const activeContest = contest ?? cachedSnapshot.contest;
    const effectiveLoading = loading && !activeContest;
    const effectiveUpdatedAt = contest ? lastUpdatedAtRef.current ?? lastUpdatedAt : cachedSnapshot.updatedAt;

    if (!activeContest) {
      return {
        contest: null,
        roundSummary: null,
        roundDetail: null,
        drinks: [],
        loading: effectiveLoading,
        error,
        refreshAll: refreshAllLocal,
        refreshRound: async () => refreshAllLocal(),
        lastUpdatedAt: effectiveUpdatedAt,
      };
    }

    const roundDetail = buildRoundDetail(activeContest);

    return {
      contest: activeContest,
      roundSummary: buildRoundSummary(activeContest),
      roundDetail,
      // Only return drinks for the active round, not all drinks
      drinks: roundDetail.entries ?? roundDetail.drinks ?? [],
      loading: effectiveLoading,
      error,
      refreshAll: refreshAllLocal,
      refreshRound: async () => refreshAllLocal(),
      lastUpdatedAt: effectiveUpdatedAt,
    };
  }, [contest, loading, error, refreshAllLocal, cachedSnapshot.contest, cachedSnapshot.updatedAt, lastUpdatedAt]);

  return <MixologyDataContext.Provider value={value}>{children}</MixologyDataContext.Provider>;
}

export function useMixologyData() {
  const context = useContext(MixologyDataContext);
  if (!context) {
    throw new Error('useMixologyData must be used within MixologyDataProvider');
  }
  return context;
}
