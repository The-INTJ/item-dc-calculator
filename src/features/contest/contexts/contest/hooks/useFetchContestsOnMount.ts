import { useEffect, useRef } from 'react';
import { contestApi } from '../../../lib/api/contestApi';
import type { ContestContextStateUpdater } from '../contestTypes';

/**
 * useFetchContestsOnMount
 * 
 * Fetches all contests from the API when the component mounts.
 */
export function useFetchContestsOnMount(
  updateState: (updater: ContestContextStateUpdater) => void,
  onComplete?: () => void
): void {
  const hasFetched = useRef(false);

  useEffect(function fetchContestsOnMount() {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      const result = await contestApi.listContests();
      if (result) {
        const { contests } = result;
        updateState((prev) => ({
          ...prev,
          contests,
          lastUpdatedAt: Date.now(),
        }));
      }
      onComplete?.();
    }

    void load();
  }, [updateState, onComplete]);
}
