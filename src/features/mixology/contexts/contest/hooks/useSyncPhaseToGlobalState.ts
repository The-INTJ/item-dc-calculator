import { useEffect } from 'react';
import type { Contest, ContestPhase } from '../../../types';

/**
 * useSyncPhaseToGlobalState
 * 
 * Syncs the active contest's phase to a global state setter whenever
 * the active contest or its phase changes.
 */
export function useSyncPhaseToGlobalState(
  contests: Contest[],
  activeContestId: string | null,
  setGlobalState: (phase: ContestPhase) => void
): void {
  useEffect(function syncPhaseToGlobalState() {
    const activeContest =
      contests.find((c) => c.id === activeContestId) ??
      contests.find((c) => c.defaultContest);
    
    if (activeContest) {
      setGlobalState(activeContest.phase);
    }
  }, [contests, activeContestId, setGlobalState]);
}
