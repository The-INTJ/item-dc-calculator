'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCurrentContest } from '../hooks/useBackend';
import { buildRoundDetail, buildRoundSummary, buildDrinkSummaries } from './uiMappings';
import type { RoundDetail, RoundSummary, DrinkSummary } from './uiTypes';
import type { Contest } from '../types';
import { getCachedContestSnapshot, setCachedContest } from './cache';

interface MixologyDataState {
  contest: Contest | null;
  roundSummary: RoundSummary | null;
  roundDetail: RoundDetail | null;
  drinks: DrinkSummary[];
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
  const { data: contest, loading, error, refresh } = useCurrentContest();
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
        void refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 2 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handleContestUpdated = () => {
      void refresh();
    };

    window.addEventListener(contestUpdatedEvent, handleContestUpdated);

    return () => {
      window.removeEventListener(contestUpdatedEvent, handleContestUpdated);
    };
  }, [refresh]);

  const value = useMemo<MixologyDataState>(() => {
    const activeContest = contest ?? cachedSnapshot.contest;
    const effectiveLoading = loading && !activeContest;
    const effectiveUpdatedAt = contest ? lastUpdatedAtRef.current : cachedSnapshot.updatedAt;

    if (!activeContest) {
      return {
        contest: null,
        roundSummary: null,
        roundDetail: null,
        drinks: [],
        loading: effectiveLoading,
        error,
        refreshAll: refresh,
        refreshRound: async () => refresh(),
        lastUpdatedAt: effectiveUpdatedAt,
      };
    }

    return {
      contest: activeContest,
      roundSummary: buildRoundSummary(activeContest),
      roundDetail: buildRoundDetail(activeContest),
      drinks: buildDrinkSummaries(activeContest.drinks),
      loading: effectiveLoading,
      error,
      refreshAll: refresh,
      refreshRound: async () => refresh(),
      lastUpdatedAt: effectiveUpdatedAt,
    };
  }, [contest, loading, error, refresh, cachedSnapshot.contest, cachedSnapshot.updatedAt]);

  return <MixologyDataContext.Provider value={value}>{children}</MixologyDataContext.Provider>;
}

export function useMixologyData() {
  const context = useContext(MixologyDataContext);
  if (!context) {
    throw new Error('useMixologyData must be used within MixologyDataProvider');
  }
  return context;
}
