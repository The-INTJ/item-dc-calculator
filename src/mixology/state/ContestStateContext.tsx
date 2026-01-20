'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Contest lifecycle states as defined in the Master Plan:
 * - Debug: Pre-contest setup and testing
 * - Set: Mixologists preparing, roster locked
 * - Shake: Mixing in progress, judges watching
 * - Score: Voting open, scores being collected
 */
export type ContestState = 'debug' | 'set' | 'shake' | 'score';

export const CONTEST_STATES: ContestState[] = ['debug', 'set', 'shake', 'score'];

export const contestStateLabels: Record<ContestState, string> = {
  debug: 'Debug',
  set: 'Set',
  shake: 'Shake',
  score: 'Score',
};

export const contestStateDescriptions: Record<ContestState, string> = {
  debug: 'Admin-only testing mode with extra logs and debug UI. Not used during live events.',
  set: 'Guests arriving and choosing roles. Happens once at competition start; admin can return here if needed.',
  shake: 'Drinks are being made, timer running, voting is OPEN.',
  score: 'Voting CLOSED. Tallying scores, preparing next round. Admin triggers next Shake when ready.',
};

interface ContestStateContextValue {
  state: ContestState;
  setState: (state: ContestState) => void;
  label: string;
  description: string;
}

const ContestStateContext = createContext<ContestStateContextValue | undefined>(undefined);

const STORAGE_KEY = 'mixology-contest-state';

function getInitialState(): ContestState {
  if (typeof window === 'undefined') {
    return 'debug';
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CONTEST_STATES.includes(stored as ContestState)) {
    return stored as ContestState;
  }
  return 'debug';
}

interface ContestStateProviderProps {
  children: React.ReactNode;
}

export function ContestStateProvider({ children }: ContestStateProviderProps) {
  const [state, setStateInternal] = useState<ContestState>('debug');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStateInternal(getInitialState());
    setMounted(true);
  }, []);

  const setState = useCallback((newState: ContestState) => {
    setStateInternal(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newState);
      window.dispatchEvent(new Event('mixology:state-changed'));
    }
  }, []);

  const value = useMemo<ContestStateContextValue>(
    () => ({
      state,
      setState,
      label: contestStateLabels[state],
      description: contestStateDescriptions[state],
    }),
    [state, setState]
  );

  if (!mounted) {
    return null;
  }

  return <ContestStateContext.Provider value={value}>{children}</ContestStateContext.Provider>;
}

export function useContestState() {
  const context = useContext(ContestStateContext);
  if (!context) {
    throw new Error('useContestState must be used within ContestStateProvider');
  }
  return context;
}
