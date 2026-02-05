'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ContestPhase } from './contest/contestTypes';

export const PHASE_VALUES: ContestPhase[] = ['set', 'shake', 'scored'];

export const phaseLabels: Record<ContestPhase, string> = {
  set: 'Set',
  shake: 'Shake',
  scored: 'Scored',
};

export const phaseDescriptions: Record<ContestPhase, string> = {
  set: 'Preparation phase. Participants joining.',
  shake: 'Active phase. Judging is OPEN.',
  scored: 'Scoring CLOSED. Tallying results.',
};

interface RoundStateContextValue {
  state: ContestPhase;
  setState: (state: ContestPhase) => void;
  label: string;
  description: string;
}

const RoundStateContext = createContext<RoundStateContextValue | undefined>(undefined);

/**
 * Round state provider - tracks the current phase of the active round.
 * State is synced from the active contest's round data.
 */
export function RoundStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<ContestPhase>('set');

  const setState = useCallback((newState: ContestPhase) => {
    setStateInternal(newState);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('contest:phase-changed'));
    }
  }, []);

  const value: RoundStateContextValue = {
    state,
    setState,
    label: phaseLabels[state],
    description: phaseDescriptions[state],
  };

  return <RoundStateContext.Provider value={value}>{children}</RoundStateContext.Provider>;
}

export function useRoundState() {
  const context = useContext(RoundStateContext);
  if (!context) {
    throw new Error('useRoundState must be used within RoundStateProvider');
  }
  return context;
}
