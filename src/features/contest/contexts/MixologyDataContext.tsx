'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { buildRoundDetail, buildRoundSummary, type RoundDetail, type RoundSummary, type EntrySummary } from '../lib/helpers/uiMappings';
import type { Contest } from './contest/contestTypes';
import { useContestData } from './contest/ContestContext';

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
  const { contests, activeContestId, lastUpdatedAt, refresh } = useContestData();
  const contest = contests.find((item) => item.id === activeContestId) ?? null;
  const lastUpdatedAtRef = useRef<number | null>(null);
  const contestUpdatedEvent = 'mixology:contest-updated';

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

  const value = useMemo<MixologyDataState>(() => {
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

  return <MixologyDataContext.Provider value={value}>{children}</MixologyDataContext.Provider>;
}

export function useMixologyData() {
  const context = useContext(MixologyDataContext);
  if (!context) {
    throw new Error('useMixologyData must be used within MixologyDataProvider');
  }
  return context;
}
