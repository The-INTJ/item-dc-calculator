import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { EffectType } from '../values';

type ActiveEffect = {
  index: number;
  effectType: EffectType;
};

type EffectInfoContextValue = {
  activeEffect: ActiveEffect | null;
  setActiveEffect: Dispatch<SetStateAction<ActiveEffect | null>>;
};

const EffectInfoContext = createContext<EffectInfoContextValue | undefined>(undefined);

export function EffectInfoProvider({ children }: { children: ReactNode }) {
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);

  const value = useMemo(
    () => ({
      activeEffect,
      setActiveEffect,
    }),
    [activeEffect]
  );

  return (
    <EffectInfoContext.Provider value={value}>
      {children}
    </EffectInfoContext.Provider>
  );
}

export function useEffectInfoContext() {
  const context = useContext(EffectInfoContext);

  if (!context) {
    throw new Error('useEffectInfoContext must be used within an EffectInfoProvider');
  }

  return context;
}

export type { ActiveEffect };
