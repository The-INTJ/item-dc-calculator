'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Contest lifecycle states as defined in the Master Plan:
 * - Set: Guests arriving, choosing roles
 * - Shake: Mixing in progress, voting OPEN
 * - Scored: Voting CLOSED, scores being tallied
 */
export type ContestState = 'set' | 'shake' | 'scored';

export const CONTEST_STATES: ContestState[] = ['set', 'shake', 'scored'];

export const contestStateLabels: Record<ContestState, string> = {
  set: 'Set',
  shake: 'Shake',
  scored: 'Scored',
};

export const contestStateDescriptions: Record<ContestState, string> = {
  set: 'Guests arriving and choosing roles. Happens once at competition start; admin can return here if needed.',
  shake: 'Drinks are being made, timer running, voting is OPEN.',
  scored: 'Voting CLOSED. Tallying scores, preparing next round. Admin triggers next Shake when ready.',
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
    return 'set';
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CONTEST_STATES.includes(stored as ContestState)) {
    return stored as ContestState;
  }
  return 'set';
}

interface ContestStateProviderProps {
  children: React.ReactNode;
}

export function ContestStateProvider({ children }: ContestStateProviderProps) {
  const [state, setStateInternal] = useState<ContestState>('set');
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
