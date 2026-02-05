'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { buildRoundDetail, buildRoundSummary } from '../lib/uiMappings';
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
  const { contests, activeContestId, lastUpdatedAt, refresh } = useAdminContestData();
  const contest = contests.find((item) => item.id === activeContestId) ?? null;
  const lastUpdatedAtRef = useRef<number | null>(null);
  const cachedSnapshot = getCachedContestSnapshot();
  const contestUpdatedEvent = 'mixology:contest-updated';

  // Update timestamp when contest data changes
  useEffect(() => {
    if (contest) {
      lastUpdatedAtRef.current = Date.now();
      setCachedContest(contest, Date.now());
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
    const activeContest = contest ?? cachedSnapshot.contest;
    const effectiveUpdatedAt = contest ? lastUpdatedAtRef.current ?? lastUpdatedAt : cachedSnapshot.updatedAt;

    if (!activeContest) {
      return {
        contest: null,
        roundSummary: null,
        roundDetail: null,
        drinks: [],
        loading: contests.length === 0,
        error: null,
        refreshAll: async () => refresh(),
        refreshRound: async () => refresh(),
        lastUpdatedAt: effectiveUpdatedAt,
      };
    }

    const roundDetail = buildRoundDetail(activeContest);

    return {
      contest: activeContest,
      roundSummary: buildRoundSummary(activeContest),
      roundDetail,
      drinks: roundDetail.entries,
      loading: false,
      error: null,
      refreshAll: async () => refresh(),
      refreshRound: async () => refresh(),
      lastUpdatedAt: effectiveUpdatedAt,
    };
  }, [contest, contests.length, refresh, cachedSnapshot.contest, cachedSnapshot.updatedAt, lastUpdatedAt]);

  return <MixologyDataContext.Provider value={value}>{children}</MixologyDataContext.Provider>;
}

export function useMixologyData() {
  const context = useContext(MixologyDataContext);
  if (!context) {
    throw new Error('useMixologyData must be used within MixologyDataProvider');
  }
  return context;
}
