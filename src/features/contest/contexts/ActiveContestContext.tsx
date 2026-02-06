'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { buildRoundDetail, buildRoundSummary, type RoundDetail, type RoundSummary, type EntrySummary } from '../lib/helpers/uiMappings';
import type { Contest } from './contest/contestTypes';
import { useContestStore } from './contest/ContestContext';

interface ActiveContestState {
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

const ActiveContestContext = createContext<ActiveContestState | undefined>(undefined);

interface ActiveContestProviderProps {
  children: React.ReactNode;
}

/**
 * ActiveContestProvider — derives UI-ready data from the active contest
 * in the contest store. Handles auto-refresh on visibility change and
 * periodic polling.
 */
export function ActiveContestProvider({ children }: ActiveContestProviderProps) {
  const { contests, activeContestId, lastUpdatedAt, refresh } = useContestStore();
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

  const value: ActiveContestState = (() => {
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
  })();

  return <ActiveContestContext.Provider value={value}>{children}</ActiveContestContext.Provider>;
}

/**
 * Hook to access the active contest's derived UI data
 * (contest object, round summary, drinks, loading state, etc.)
 */
export function useActiveContest() {
  const context = useContext(ActiveContestContext);
  if (!context) {
    throw new Error('useActiveContest must be used within ActiveContestProvider');
  }
  return context;
}
