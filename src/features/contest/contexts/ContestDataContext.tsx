'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { buildRoundDetail, buildRoundSummary, type RoundDetail, type RoundSummary, type EntrySummary } from '../lib/helpers/uiMappings';
import type { Contest } from './contest/contestTypes';
import { useContestData } from './contest/ContestContext';

interface ContestDataState {
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

const ContestDataContext = createContext<ContestDataState | undefined>(undefined);

interface ContestDataProviderProps {
  children: React.ReactNode;
}

export function ContestDataProvider({ children }: ContestDataProviderProps) {
  const { contests, activeContestId, lastUpdatedAt, refresh } = useContestData();
  const contest = contests.find((item) => item.id === activeContestId) ?? null;
  const lastUpdatedAtRef = useRef<number | null>(null);
  const contestUpdatedEvent = 'contest:data-updated';

  // Update timestamp when contest data changes
  useEffect(() => {
    if (contest) {
      lastUpdatedAtRef.current = Date.now();
    }
  }, [contest]);

  // Auto-refresh on tab visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  // Auto-refresh on interval (every 2 minutes)
  useEffect(() => {
    const interval = window.setInterval(() => refresh(), 2 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  // Listen for external contest update events
  useEffect(() => {
    const handleContestUpdated = () => refresh();
    window.addEventListener(contestUpdatedEvent, handleContestUpdated);
    return () => window.removeEventListener(contestUpdatedEvent, handleContestUpdated);
  }, [refresh]);

  const value = useMemo<ContestDataState>(() => {
    if (!contest) {
      return {
        contest: null,
        roundSummary: null,
        roundDetail: null,
        drinks: [],
        loading: contests.length === 0,
        error: null,
        refreshAll: async () => refresh(),
        refreshRound: async () => refresh(),
        lastUpdatedAt: lastUpdatedAtRef.current ?? lastUpdatedAt,
      };
    }

    const roundDetail = buildRoundDetail(contest);

    return {
      contest,
      roundSummary: buildRoundSummary(contest),
      roundDetail,
      drinks: roundDetail.entries,
      loading: false,
      error: null,
      refreshAll: async () => refresh(),
      refreshRound: async () => refresh(),
      lastUpdatedAt: lastUpdatedAtRef.current ?? lastUpdatedAt,
    };
  }, [contest, contests.length, refresh, lastUpdatedAt]);

  return <ContestDataContext.Provider value={value}>{children}</ContestDataContext.Provider>;
}

export function useContestDetails() {
  const context = useContext(ContestDataContext);
  if (!context) {
    throw new Error('useContestDetails must be used within ContestDataProvider');
  }
  return context;
}
