'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useContestState } from '../ContestStateContext';
import { useAuth } from '../AuthContext';
import { useFetchContestsOnMount, useSyncPhaseToGlobalState, useContestActions, useVoting } from './hooks';
import type { ContestState, ContestActions, VotingActions } from './types';

type ContestContextValue = ContestState & ContestActions & VotingActions & { refresh: () => void };

const ContestContext = createContext<ContestContextValue | undefined>(undefined);

export function ContestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ContestState>({
    contests: [],
    activeContestId: null,
    lastUpdatedAt: null,
  });
  const [, setLoadCount] = useState(0);
  const { setState: setGlobalPhase } = useContestState();
  const { session } = useAuth();

  const updateState = useCallback((updater: (prev: ContestState) => ContestState) => {
    setState((prev) => ({ ...updater(prev), lastUpdatedAt: Date.now() }));
  }, []);

  const refresh = useCallback(() => setLoadCount((c) => c + 1), []);

  // Named effects
  useFetchContestsOnMount(updateState);
  useSyncPhaseToGlobalState(state.contests, state.activeContestId, setGlobalPhase);

  // All mutation actions
  const actions = useContestActions(state, updateState);
  const voting = useVoting(session?.firebaseUid ?? null);

  const value = useMemo<ContestContextValue>(() => {
    const activeContest =
      state.contests.find((c) => c.id === state.activeContestId) ??
      state.contests.find((c) => c.defaultContest);

    return {
      contests: state.contests,
      activeContestId: activeContest?.id ?? state.activeContestId,
      lastUpdatedAt: state.lastUpdatedAt,
      refresh,
      ...actions,
      ...voting,
    };
  }, [state, refresh, actions, voting]);

  return <ContestContext.Provider value={value}>{children}</ContestContext.Provider>;
}

export function useContestData() {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error('useContestData must be used within ContestProvider');
  }
  return context;
}

// Re-export types
export type { ContestState, ContestActions } from './types';
