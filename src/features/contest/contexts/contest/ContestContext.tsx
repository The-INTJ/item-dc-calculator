'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useFetchContestsOnMount } from './hooks/useFetchContestsOnMount';
import { useContestActions } from './hooks/useContestActions';
import { useVoting } from './hooks/useVoting';
import type { Contest, ContestContextState, ContestActions, VotingActions } from './contestTypes';

type ContestContextValue = ContestContextState & ContestActions & VotingActions & {
  refresh: () => void;
};

const ContestContext = createContext<ContestContextValue | undefined>(undefined);

export function ContestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ContestContextState>({
    contests: [],
    lastUpdatedAt: null,
  });
  const [, setLoadCount] = useState(0);
  const { session } = useAuth();

  const updateState = useCallback((updater: (prev: ContestContextState) => ContestContextState) => {
    setState((prev) => ({ ...updater(prev), lastUpdatedAt: Date.now() }));
  }, []);

  const refresh = useCallback(() => setLoadCount((c) => c + 1), []);

  // Named effects
  useFetchContestsOnMount(updateState);

  // All mutation actions
  const actions = useContestActions(state, updateState);
  const voting = useVoting(session?.firebaseUid ?? null);

  const value: ContestContextValue = {
    contests: state.contests,
    lastUpdatedAt: state.lastUpdatedAt,
    refresh,
    ...actions,
    ...voting,
  };

  return <ContestContext.Provider value={value}>{children}</ContestContext.Provider>;
}

export function useContestStore() {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error('useContestStore must be used within ContestProvider');
  }
  return context;
}

// Re-export types
export type { Contest, ContestContextState, ContestActions } from './contestTypes';
