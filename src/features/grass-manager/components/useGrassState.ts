'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_STATE, loadGrassState, saveGrassState } from '../lib/storage';
import type { CareEvent, GrassManagerState, GrassProfile, YardSegment } from '../lib/types';

export function useGrassState() {
  const [state, setState] = useState<GrassManagerState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setState(loadGrassState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) setSaveError(!saveGrassState(state));
  }, [hydrated, state]);

  function updateProfile(patch: Partial<GrassProfile>) {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }

  function chooseSegment(segmentId: string) {
    setState((current) => ({ ...current, selectedSegmentId: current.selectedSegmentId === segmentId ? '' : segmentId }));
  }

  function updateZone(segment: YardSegment, patch: Partial<Pick<YardSegment, 'sun' | 'condition'>>) {
    setState((current) => ({ ...current, zones: { ...current.zones,
      [segment.id]: { sun: segment.sun, condition: segment.condition, ...patch },
    } }));
  }

  function addCareEvent(input: Omit<CareEvent, 'id'>) {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setState((current) => ({ ...current, events: [{ ...input, id }, ...current.events].slice(0, 200) }));
  }

  function removeCareEvent(id: string) {
    setState((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }));
  }

  return { state, hydrated, saveError, updateProfile, updateZone, chooseSegment, addCareEvent, removeCareEvent };
}
