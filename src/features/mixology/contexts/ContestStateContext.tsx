'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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

interface ContestStateProviderProps {
  children: React.ReactNode;
}

/**
 * Contest state provider - cloud-only.
 * State is fetched from Firestore and updates are synced back.
 * No local persistence - if cloud is unavailable, we show error states.
 */
export function ContestStateProvider({ children }: ContestStateProviderProps) {
  // Default to 'set' - will be populated from cloud contest data
  const [state, setStateInternal] = useState<ContestState>('set');

  const setState = useCallback((newState: ContestState) => {
    setStateInternal(newState);
    // Emit event for potential listeners
    if (typeof window !== 'undefined') {
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

  return <ContestStateContext.Provider value={value}>{children}</ContestStateContext.Provider>;
}

export function useContestState() {
  const context = useContext(ContestStateContext);
  if (!context) {
    throw new Error('useContestState must be used within ContestStateProvider');
  }
  return context;
}
