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
 * ActiveContestProvider — placeholder provider now that global "active contest"
 * selection has been removed. Contest selection is driven by URL params.
 * Sub-pages will be migrated to use URL-based contest lookup.
 */
export function ActiveContestProvider({ children }: ActiveContestProviderProps) {
  const { contests, lastUpdatedAt, refresh } = useContestStore();

  const value: ActiveContestState = {
    contest: null,
    roundSummary: null,
    roundDetail: null,
    drinks: [],
    loading: contests.length === 0,
    error: null,
    refreshAll: async () => refresh(),
    refreshRound: async () => refresh(),
    lastUpdatedAt,
  };

  return <ActiveContestContext.Provider value={value}>{children}</ActiveContestContext.Provider>;
}

/**
 * Hook to access the active contest's derived UI data.
 * Currently returns null contest since global selection was deprecated.
 * Pages should migrate to URL-param-based contest lookup.
 */
export function useActiveContest() {
  const context = useContext(ActiveContestContext);
  if (!context) {
    throw new Error('useActiveContest must be used within ActiveContestProvider');
  }
  return context;
}
